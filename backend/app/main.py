import asyncio
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.incidents import router as incidents_router
from app.api.analytics import router as analytics_router
from app.api.websocket import router as ws_router, manager
from app.services.mock_db import db
from app.models.schemas import UnitStatus, SensorAlertStatus

# Background telemetry oscillation to make the smart city feel dynamic & responsive
async def simulate_smart_city_telemetry():
    while True:
        try:
            await asyncio.sleep(6.0) # every 6 seconds
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # 1. Micro-oscillate sensor values
            for sensor in db.sensors.values():
                drift = random.uniform(-0.04, 0.04)
                sensor.value = round(max(0.1, sensor.value + drift), 2)
                sensor.last_updated = now_iso
                
                # Check threshold
                if sensor.value >= sensor.threshold * 1.15:
                    sensor.status = SensorAlertStatus.CRITICAL
                elif sensor.value >= sensor.threshold:
                    sensor.status = SensorAlertStatus.WARNING
                else:
                    sensor.status = SensorAlertStatus.NORMAL

            # 2. Update units currently EN_ROUTE (decrement ETA, simulate movement)
            for unit in db.units.values():
                if unit.status == UnitStatus.EN_ROUTE and unit.eta_minutes:
                    unit.eta_minutes = round(max(0.0, unit.eta_minutes - 0.2), 1)
                    if unit.eta_minutes <= 0.2:
                        unit.status = UnitStatus.ON_SCENE
                        unit.eta_minutes = 0.0
                        unit.speed_kmh = 0.0

            # 3. Dynamic Green Corridor: check signals proximity to en-route ambulances
            active_ambs = [u for u in db.units.values() if u.status == UnitStatus.EN_ROUTE]
            for sig in db.traffic_signals.values():
                min_dist = 999.0
                closest_amb_id = None
                for amb in active_ambs:
                    # Calculate distance
                    from app.services.dispatch_engine import calculate_haversine_distance
                    d = calculate_haversine_distance(amb.location.lat, amb.location.lng, sig.coordinates.lat, sig.coordinates.lng)
                    if d < min_dist:
                        min_dist = d
                        closest_amb_id = amb.id

                sig.distance_to_active_ambulance_km = round(min_dist, 2) if min_dist < 900 else None
                # If approaching within 1.0 km, turn GREEN (EMERGENCY OVERRIDE)
                if min_dist <= 1.0:
                    from app.models.schemas import TrafficSignalState
                    sig.state = TrafficSignalState.EMERGENCY_OVERRIDE
                    sig.is_overridden = True
                    sig.cleared_for_ambulance_id = closest_amb_id
                    sig.last_state_change = now_iso
                elif sig.is_overridden and min_dist > 1.8:
                    from app.models.schemas import TrafficSignalState
                    sig.state = TrafficSignalState.RED
                    sig.is_overridden = False
                    sig.cleared_for_ambulance_id = None

            # Broadcast live sensor telemetry packet over WebSocket
            if manager.active_connections:
                await manager.broadcast("TELEMETRY_PULSE", {
                    "timestamp": now_iso,
                    "sensors": [s.model_dump() for s in db.sensors.values()],
                    "units": [u.model_dump() for u in db.units.values()],
                    "signals": [sig.model_dump() for sig in db.traffic_signals.values()],
                    "hospitals": [h.model_dump() for h in db.hospitals.values()]
                })

        except asyncio.CancelledError:
            break
        except Exception as e:
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn background simulation task
    task = asyncio.create_task(simulate_smart_city_telemetry())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Autonomous Command & Control Center for Urban Disasters & Emergency Response",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(incidents_router, prefix=settings.API_V1_STR, tags=["Incidents & Units"])
app.include_router(analytics_router, prefix=settings.API_V1_STR, tags=["Analytics & Risk Matrix"])
app.include_router(ws_router, prefix=settings.API_V1_STR, tags=["Realtime WebSocket"])

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_model": settings.GEMINI_MODEL,
        "api_key_configured": bool(settings.GEMINI_API_KEY)
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }
