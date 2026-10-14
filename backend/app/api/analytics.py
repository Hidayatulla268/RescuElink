from typing import Dict, Any, List
from fastapi import APIRouter, Response
from app.models.schemas import UrbanRiskMetrics, PriorityLevel, IncidentStatus, UnitStatus, SensorAlertStatus
from app.services.mock_db import db

router = APIRouter()

@router.get("/analytics/metrics", response_model=UrbanRiskMetrics)
async def get_urban_risk_metrics(response: Response):
    """
    Calculates live urban resilience indicators, predictive threat matrix,
    and fleet availability metrics across the Bengaluru Urban Transit Corridor.
    """
    # Cache analytics for 5 seconds to reduce computation overhead
    response.headers["Cache-Control"] = "public, max-age=5, stale-while-revalidate=10"
    
    active_incidents = [
        inc for inc in db.incidents.values()
        if inc.status not in [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED]
    ]
    p1_count = sum(1 for inc in active_incidents if inc.priority == PriorityLevel.P1)
    available_units = sum(1 for u in db.units.values() if u.status == UnitStatus.IDLE)
    critical_sensors = sum(1 for s in db.sensors.values() if s.status == SensorAlertStatus.CRITICAL)

    # Average active ETA
    etas = [u.eta_minutes for u in db.units.values() if u.eta_minutes and u.eta_minutes > 0]
    avg_eta = round(sum(etas) / len(etas), 1) if etas else 4.2

    # City resilience score (0-100)
    # Deduct points for active P1s, critical sensors, and depleted units
    resilience = 100.0 - (p1_count * 12.0) - (len(active_incidents) * 3.5) - (critical_sensors * 5.0)
    if available_units < 2:
        resilience -= 15.0
    resilience = max(min(round(resilience, 1), 99.0), 30.0)

    # Bengaluru Metropolitan Emergency Zones
    high_risk_zones = [
        {
            "zone_id": "ZONE-1-SILK-BOARD",
            "name": "Central Silk Board & Hosur Road Express Junction",
            "threat_level": "CRITICAL" if p1_count > 0 else "ELEVATED",
            "active_hazards": ["Chemical Storage Incident", "Flyover Junction Congestion (92%)"],
            "vulnerability_index": 88.6,
            "population_density": "Very High (Transit Hub)"
        },
        {
            "zone_id": "ZONE-2-KORAMANGALA",
            "name": "Koramangala 80ft Road & Sony World Junction",
            "threat_level": "ELEVATED",
            "active_hazards": ["Underpass Inundation (1.6m)", "Traffic Divert Active"],
            "vulnerability_index": 74.2,
            "population_density": "High (Commercial & Residential)"
        },
        {
            "zone_id": "ZONE-3-INDIRANAGAR",
            "name": "Indiranagar 100ft Road & CMH Corridor",
            "threat_level": "STABLE",
            "active_hazards": ["None Active - Green Corridor Clear"],
            "vulnerability_index": 21.5,
            "population_density": "Moderate (Retail & Arterial)"
        }
    ]

    timeline = [
        {"time": "13:30", "incident_count": 1, "avg_response_min": 4.5},
        {"time": "13:45", "incident_count": 2, "avg_response_min": 4.0},
        {"time": "14:00", "incident_count": 3, "avg_response_min": 3.6},
        {"time": "14:15", "incident_count": len(active_incidents), "avg_response_min": avg_eta},
    ]

    return UrbanRiskMetrics(
        active_incidents_count=len(active_incidents),
        p1_critical_count=p1_count,
        available_units_count=available_units,
        average_dispatch_eta_minutes=avg_eta,
        sensor_alert_count=critical_sensors,
        overall_city_resilience_score=resilience,
        high_risk_zones=high_risk_zones,
        incident_timeline=timeline
    )
