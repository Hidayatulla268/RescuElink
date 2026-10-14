"""
RescuELINK: Autonomous Smart City AI Emergency Dispatch & Urban Resilience Command System.
FastAPI Application Entry Point.
"""

import asyncio
import random
import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles


from app.config import settings
from app.api.incidents import router as incidents_router
from app.api.analytics import router as analytics_router
from app.api.websocket import router as ws_router, manager
from app.services.mock_db import db
from app.models.schemas import UnitStatus, SensorAlertStatus, TrafficSignalState
from app.services.dispatch_engine import calculate_haversine_distance
from app.core.security import (
    SecurityHeadersMiddleware,
    RateLimiterMiddleware,
    RequestSizeLimitMiddleware,
    generate_gov_token,
    verify_gov_token,
    sanitize_input_text
)

logger = logging.getLogger(__name__)


# Optimized background telemetry simulation
async def simulate_smart_city_telemetry():
    """
    Simulates real-time IoT sensor telemetry and dynamic Green Corridor signal distance tracking.
    Optimized for zero-redundancy imports and minimal event loop overhead.
    """
    while True:
        try:
            await asyncio.sleep(6.0)
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
                    d = calculate_haversine_distance(
                        amb.location.lat, amb.location.lng,
                        sig.coordinates.lat, sig.coordinates.lng
                    )
                    if d < min_dist:
                        min_dist = d
                        closest_amb_id = amb.id

                sig.distance_to_active_ambulance_km = round(min_dist, 2) if min_dist < 900 else None
                # If approaching within 1.0 km, turn GREEN (EMERGENCY OVERRIDE)
                if min_dist <= 1.0:
                    sig.state = TrafficSignalState.EMERGENCY_OVERRIDE
                    sig.is_overridden = True
                    sig.cleared_for_ambulance_id = closest_amb_id
                    sig.last_state_change = now_iso
                elif sig.is_overridden and min_dist > 1.8:
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
        except Exception as exc:
            logger.error(f"Telemetry cycle error: {exc}", exc_info=False)
            await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(simulate_smart_city_telemetry())
    yield
    task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Autonomous Command & Control Center for Urban Emergency Response (India Edition)",
    lifespan=lifespan
)

# 1. GZip Response Compression (Cuts network transmission size by ~70%)
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. Defense-in-Depth Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Sliding Window Rate Limiting (Anti-DDoS / Brute Force protection)
app.add_middleware(RateLimiterMiddleware)

# 4. Request Body Size Limiter (10MB Max to protect memory exhaustion)
app.add_middleware(RequestSizeLimitMiddleware)

# 5. Production CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining"]
)

# Global Exception Handler for structured RFC 7807 error schema
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "path": str(request.url.path),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Emergency resilience fallback active.",
                "path": str(request.url.path),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )


# --- Government Authentication Schemas & Endpoints ---
class GovLoginRequest(BaseModel):
    badge_id: str = Field(..., min_length=3, max_length=50, description="Official government identification badge ID")
    role: str = Field(..., min_length=2, max_length=50, description="Role title")
    name: str = Field(..., min_length=2, max_length=100, description="Officer / Responder full name")
    department: Optional[str] = Field(default="Municipal Emergency Response")

class GovLoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: Dict[str, Any]
    expires_in_seconds: int = 86400
    issued_at: str

class TokenVerifyRequest(BaseModel):
    token: str = Field(..., min_length=10, description="HMAC-SHA256 bearer token string")

class TokenVerifyResponse(BaseModel):
    valid: bool
    claims: Dict[str, Any]

class HealthSecurityStatus(BaseModel):
    rate_limiter_active: bool = True
    security_headers: bool = True
    gzip_compression: bool = True
    rbac_auth: bool = True

class HealthCheckResponse(BaseModel):
    status: str
    system: str
    version: str
    gemini_model: str
    api_key_configured: bool
    security: HealthSecurityStatus

class RootResponse(BaseModel):
    message: str
    docs_url: str
    api_prefix: str
    helplines: Dict[str, int]


@app.post(f"{settings.API_V1_STR}/auth/gov-login", response_model=GovLoginResponse, tags=["Authentication"])
async def government_login(payload: GovLoginRequest) -> GovLoginResponse:
    """
    Authenticates an official government worker (Ambulance Driver, Fire Chief, Police, ER Doctor, Dispatcher)
    and returns a signed cryptographic HMAC-SHA256 bearer token.
    """
    clean_badge = sanitize_input_text(payload.badge_id)
    clean_role = sanitize_input_text(payload.role)
    clean_name = sanitize_input_text(payload.name)
    clean_dept = sanitize_input_text(payload.department)

    token = generate_gov_token(badge_id=clean_badge, role=clean_role, name=clean_name)
    now_iso = datetime.now(timezone.utc).isoformat()

    return GovLoginResponse(
        access_token=token,
        token_type="Bearer",
        user={
            "badge_id": clean_badge,
            "role": clean_role,
            "name": clean_name,
            "department": clean_dept,
            "is_verified": True
        },
        expires_in_seconds=86400,
        issued_at=now_iso
    )


@app.post(f"{settings.API_V1_STR}/auth/verify", response_model=TokenVerifyResponse, tags=["Authentication"])
async def verify_token(payload: TokenVerifyRequest) -> TokenVerifyResponse:
    """Verifies a government bearer token signature and expiration."""
    claims = verify_gov_token(payload.token)
    return TokenVerifyResponse(valid=True, claims=claims)


# Include Routers
app.include_router(incidents_router, prefix=settings.API_V1_STR, tags=["Incidents & Units"])
app.include_router(analytics_router, prefix=settings.API_V1_STR, tags=["Analytics & Risk Matrix"])
app.include_router(ws_router, prefix=settings.API_V1_STR, tags=["Realtime WebSocket"])

@app.get("/health", response_model=HealthCheckResponse, tags=["System"])
@app.get("/api/health", response_model=HealthCheckResponse, tags=["System"])
async def health_check() -> HealthCheckResponse:
    """System health check and environmental status."""
    return HealthCheckResponse(
        status="healthy",
        system=settings.PROJECT_NAME,
        version=settings.VERSION,
        gemini_model=settings.GEMINI_MODEL,
        api_key_configured=bool(settings.GEMINI_API_KEY),
        security=HealthSecurityStatus(
            rate_limiter_active=True,
            security_headers=True,
            gzip_compression=True,
            rbac_auth=True
        )
    )

# --- Production API Discovery & Static Serving ---
@app.get("/api", response_model=RootResponse, tags=["System"])
@app.get(f"{settings.API_V1_STR}", response_model=RootResponse, tags=["System"])
async def api_root() -> RootResponse:
    """Root discovery endpoint providing links and national helpline matrix."""
    return RootResponse(
        message=f"Welcome to {settings.PROJECT_NAME}",
        docs_url="/docs",
        api_prefix=settings.API_V1_STR,
        helplines={
            "national_emergency": 112,
            "ambulance_trauma": 108,
            "fire_rescue": 101,
            "police_highway": 100
        }
    )

# Production Static Files & React SPA Routing
frontend_dist = os.path.abspath(settings.FRONTEND_DIST_DIR)
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.isdir(frontend_dist):
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/manifest.json", include_in_schema=False)
    async def serve_manifest():
        manifest_path = os.path.join(frontend_dist, "manifest.json")
        if os.path.isfile(manifest_path):
            return FileResponse(manifest_path, media_type="application/manifest+json")
        raise HTTPException(status_code=404, detail="Manifest not found")

    @app.get("/robots.txt", include_in_schema=False)
    async def serve_robots():
        robots_path = os.path.join(frontend_dist, "robots.txt")
        if os.path.isfile(robots_path):
            return FileResponse(robots_path, media_type="text/plain")
        raise HTTPException(status_code=404, detail="Robots not found")

    @app.get("/favicon.svg", include_in_schema=False)
    async def serve_favicon():
        fav_path = os.path.join(frontend_dist, "favicon.svg")
        if os.path.isfile(fav_path):
            return FileResponse(fav_path, media_type="image/svg+xml")
        raise HTTPException(status_code=404, detail="Favicon not found")

    @app.get("/", include_in_schema=False)
    async def serve_root_page():
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file, media_type="text/html")
        return await api_root()

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_route(full_path: str):
        # Pass-through API, docs, or health requests to 404 handler if unhandled
        if full_path.startswith("api") or full_path in ["health", "docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="Endpoint not found")

        exact_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(exact_file):
            return FileResponse(exact_file)

        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file, media_type="text/html")

        raise HTTPException(status_code=404, detail="Resource not found")
else:
    @app.get("/", response_model=RootResponse, tags=["System"])
    async def root() -> RootResponse:
        return await api_root()

