from typing import Dict, Any
from fastapi import APIRouter
from app.models.schemas import UrbanRiskMetrics, PriorityLevel, IncidentStatus, UnitStatus, SensorAlertStatus
from app.services.mock_db import db

router = APIRouter()

@router.get("/analytics/metrics", response_model=UrbanRiskMetrics)
async def get_urban_risk_metrics():
    """Calculates live urban resilience indicators and predictive threat matrix."""
    active_incidents = [
        inc for inc in db.incidents.values()
        if inc.status not in [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED]
    ]
    p1_count = sum(1 for inc in active_incidents if inc.priority == PriorityLevel.P1)
    available_units = sum(1 for u in db.units.values() if u.status == UnitStatus.IDLE)
    critical_sensors = sum(1 for s in db.sensors.values() if s.status == SensorAlertStatus.CRITICAL)

    # Average active ETA
    etas = [u.eta_minutes for u in db.units.values() if u.eta_minutes and u.eta_minutes > 0]
    avg_eta = round(sum(etas) / len(etas), 1) if etas else 4.5

    # City resilience score (0-100)
    # Deduct points for active P1s, critical sensors, and depleted units
    resilience = 100.0 - (p1_count * 12.0) - (len(active_incidents) * 3.5) - (critical_sensors * 5.0)
    if available_units < 2:
        resilience -= 15.0
    resilience = max(min(round(resilience, 1), 99.0), 30.0)

    high_risk_zones = [
        {
            "zone_id": "ZONE-4-SOUTH-BAY",
            "name": "Mission Creek Maritime & Chemical Corridor",
            "threat_level": "CRITICAL",
            "active_hazards": ["Chemical Storage Blaze", "Flood Basin Overflow (2.4m)"],
            "vulnerability_index": 92.4,
            "population_density": "High (Commercial/Industrial)"
        },
        {
            "zone_id": "ZONE-1-FINANCIAL",
            "name": "Financial Core & Transit Subterranean",
            "threat_level": "ELEVATED",
            "active_hazards": ["Underpass Inundation", "Traffic Gridlock (89%)"],
            "vulnerability_index": 76.8,
            "population_density": "Very High (Commuter Arterial)"
        },
        {
            "zone_id": "ZONE-7-WEST-HILLS",
            "name": "Western Residential Foothills",
            "threat_level": "STABLE",
            "active_hazards": ["None Active"],
            "vulnerability_index": 18.2,
            "population_density": "Moderate (Residential)"
        }
    ]

    timeline = [
        {"time": "10:00", "incident_count": 1, "avg_response_min": 5.2},
        {"time": "10:15", "incident_count": 2, "avg_response_min": 4.8},
        {"time": "10:30", "incident_count": 4, "avg_response_min": 4.1},
        {"time": "10:45", "incident_count": len(active_incidents), "avg_response_min": avg_eta},
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
