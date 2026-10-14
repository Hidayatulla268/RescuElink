import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from app.models.schemas import (
    Incident, IncidentCreate, IncidentStatus, PriorityLevel,
    ResponderUnit, IoTSensor, DispatchActionRequest, CitizenBroadcastRequest,
    CitizenBroadcastResponse, UnitStatus, Hospital, TrafficSignal,
    GreenCorridorTransitRequest, GreenCorridorTransitSession,
    CitizenSnapReport, AutoScrambleResult, RoadSegment,
    HospitalRoutingRequest, HospitalRoutingResponse,
    DriverRouteAcceptanceRequest, DriverRouteAcceptanceResponse
)
from app.services.mock_db import db
from app.services.gemini_service import gemini_service
from app.services.dispatch_engine import dispatch_engine
from app.services.routing_engine import routing_engine
from app.api.websocket import manager
from app.core.security import sanitize_input_text

router = APIRouter()

@router.get("/incidents", response_model=List[Incident])
async def list_incidents(
    priority: Optional[PriorityLevel] = None,
    status: Optional[IncidentStatus] = None
):
    """Retrieve all smart city incidents, with optional priority/status filtering."""
    results = list(db.incidents.values())
    if priority:
        results = [inc for inc in results if inc.priority == priority]
    if status:
        results = [inc for inc in results if inc.status == status]
    # Sort with P1 first, then newest
    priority_order = {PriorityLevel.P1: 0, PriorityLevel.P2: 1, PriorityLevel.P3: 2, PriorityLevel.P4: 3}
    results.sort(key=lambda x: (priority_order.get(x.priority, 99), x.created_at), reverse=False)
    return results

@router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Retrieve full incident details including AI Triage and assigned units."""
    incident = db.incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/incidents", response_model=Incident)
async def create_incident(payload: IncidentCreate, background_tasks: BackgroundTasks):
    """
    Ingest a new citizen SOS or 112 emergency report.
    Instantly runs Gemini 3.8 Flash Multimodal Triage, sanitizes inputs, stores incident, and broadcasts.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    new_id = f"inc-112-{uuid.uuid4().hex[:6]}"

    # Sanitize user inputs against XSS and script injection
    clean_desc = sanitize_input_text(payload.raw_description)
    clean_addr = sanitize_input_text(payload.location_address)
    clean_caller = sanitize_input_text(payload.caller_name) or "Anonymous Citizen"
    clean_phone = sanitize_input_text(payload.caller_phone) or "112-Intake"
    clean_title = sanitize_input_text(payload.title) if payload.title else f"Incident at {clean_addr}"

    # Run AI Triage via Gemini
    triage_result = await gemini_service.analyze_and_triage_incident(
        raw_description=clean_desc,
        location_address=clean_addr,
        caller_name=clean_caller,
        image_base64=payload.image_base64
    )

    incident = Incident(
        id=new_id,
        title=clean_title,
        caller_name=clean_caller,
        caller_phone=clean_phone,
        raw_description=clean_desc,
        location_address=clean_addr,
        coordinates=payload.coordinates,
        image_url=payload.image_base64 if payload.image_base64 else None,
        status=IncidentStatus.REPORTED,
        priority=triage_result.priority,
        category=triage_result.category,
        triage=triage_result,
        assigned_unit_ids=[],
        created_at=now_iso,
        updated_at=now_iso
    )

    db.incidents[new_id] = incident

    # WebSocket Broadcast
    background_tasks.add_task(
        manager.broadcast,
        "INCIDENT_CREATED",
        incident.model_dump()
    )

    return incident

@router.get("/incidents/{incident_id}/recommendations")
async def get_incident_dispatch_recommendations(incident_id: str):
    """Computes AI-ranked responder unit recommendations using distance, ETA, and capabilities."""
    incident = db.incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    recommendations = dispatch_engine.recommend_dispatch(incident)
    return {
        "incident_id": incident.id,
        "priority": incident.priority.value,
        "category": incident.category.value,
        "recommended_units": recommendations
    }

@router.post("/incidents/{incident_id}/dispatch")
async def dispatch_units_to_incident(
    incident_id: str,
    payload: DispatchActionRequest,
    background_tasks: BackgroundTasks
):
    """Executes dispatch order for selected units to incident location."""
    incident = db.incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not payload.unit_ids:
        raise HTTPException(status_code=400, detail="At least one unit must be selected for dispatch")

    result = dispatch_engine.execute_dispatch(incident_id, payload.unit_ids)

    # Broadcast updates over WebSocket
    background_tasks.add_task(
        manager.broadcast,
        "UNITS_DISPATCHED",
        result
    )

    return result

@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str, background_tasks: BackgroundTasks):
    """Marks an incident as resolved and frees all assigned responder units back to IDLE."""
    incident = db.incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    incident.status = IncidentStatus.RESOLVED
    incident.updated_at = now_iso

    for uid in incident.assigned_unit_ids:
        unit = db.units.get(uid)
        if unit:
            unit.status = UnitStatus.IDLE
            unit.assigned_incident_id = None
            unit.eta_minutes = None
            unit.speed_kmh = 0.0

    background_tasks.add_task(
        manager.broadcast,
        "INCIDENT_RESOLVED",
        {"incident_id": incident.id, "status": "RESOLVED"}
    )

    return {"status": "success", "incident_id": incident.id}

@router.post("/incidents/{incident_id}/broadcast", response_model=CitizenBroadcastResponse)
async def generate_citizen_broadcast(
    incident_id: str,
    payload: CitizenBroadcastRequest,
    background_tasks: BackgroundTasks
):
    """
    Triggers Gemini to compose localized emergency citizen alerts across Indian languages,
    along with CPR/evacuation corridors.
    """
    incident = db.incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    hazards = incident.triage.detected_hazards if incident.triage else ["General Safety Threat"]
    clean_advisory = sanitize_input_text(payload.advisory_type)
    
    alerts = await gemini_service.generate_citizen_broadcast(
        incident_title=incident.title,
        category=incident.category.value,
        location=incident.location_address,
        hazards=hazards,
        advisory_type=clean_advisory,
        languages=payload.languages
    )

    first_aid = [
        "Remain calm and check for direct injury before moving",
        "Keep airways unobstructed and protect cervical spine if trauma is suspected",
        "Maintain safe distance from downed electrical wires, flood currents, or structural cracks",
        "Clear road lanes immediately for approaching 108 ambulances and emergency sirens"
    ]

    response = CitizenBroadcastResponse(
        incident_id=incident.id,
        title=f"CIVIC ADVISORY: {incident.title}",
        generated_alerts=alerts,
        first_aid_guidance=first_aid,
        evacuation_corridor=f"Exit via Outer Ring Road arterial bypass toward safe staging zone. Avoid {incident.location_address}.",
        channels_notified=["Cellular Emergency Broadcast (WEA)", "Citywide Public Address Siren", "Metro Transit Display Boards", "Mobile Citizen App"],
        broadcast_timestamp=datetime.now(timezone.utc).isoformat()
    )

    background_tasks.add_task(
        manager.broadcast,
        "BROADCAST_TRANSMITTED",
        response.model_dump()
    )

    return response

# Responder Units Endpoints
@router.get("/units", response_model=List[ResponderUnit])
async def list_units(response: Response):
    """Retrieve all first responder units and their live status."""
    response.headers["Cache-Control"] = "public, max-age=2, stale-while-revalidate=5"
    return list(db.units.values())

@router.patch("/units/{unit_id}/status")
async def update_unit_status(unit_id: str, status: UnitStatus, background_tasks: BackgroundTasks):
    """Update status of a responder unit."""
    unit = db.units.get(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    unit.status = status
    if status == UnitStatus.IDLE:
        unit.assigned_incident_id = None
        unit.eta_minutes = None
        unit.speed_kmh = 0.0

    background_tasks.add_task(
        manager.broadcast,
        "UNIT_UPDATED",
        unit.model_dump()
    )
    return unit

# IoT Sensors Endpoints
@router.get("/sensors", response_model=List[IoTSensor])
async def list_sensors(response: Response):
    """Retrieve all Smart City IoT sensor nodes and active alert levels."""
    response.headers["Cache-Control"] = "public, max-age=3, stale-while-revalidate=6"
    return list(db.sensors.values())

# --- Green Corridor, Traffic Signals & Hospital ER Coordination Endpoints ---

@router.get("/hospitals", response_model=List[Hospital])
async def list_hospitals(response: Response):
    """Retrieve all metropolitan trauma centers and live ER capacities with caching."""
    response.headers["Cache-Control"] = "public, max-age=10, stale-while-revalidate=30"
    return list(db.hospitals.values())

@router.get("/traffic-signals", response_model=List[TrafficSignal])
async def list_traffic_signals(response: Response):
    """Retrieve all smart traffic signals and emergency green preemption states with caching."""
    response.headers["Cache-Control"] = "public, max-age=3, stale-while-revalidate=6"
    return list(db.traffic_signals.values())

@router.post("/ambulance/transit/start", response_model=GreenCorridorTransitSession)
async def start_ambulance_green_corridor(
    payload: GreenCorridorTransitRequest,
    background_tasks: BackgroundTasks
):
    """
    Activates the GreenCorridor AI system:
    1. Driver sets current location and destination hospital.
    2. App calculates emergency corridor.
    3. Traffic signals within 1 km are preempted to 100% GREEN.
    4. Hospital ER Trauma team is alerted to assemble and reserve a sterile bay.
    5. Route clearance broadcast sent to all motorists in transit zone.
    """
    clean_addr = sanitize_input_text(payload.pickup_address)
    clean_cond = sanitize_input_text(payload.patient_condition)

    session = dispatch_engine.activate_green_corridor(
        ambulance_id=payload.ambulance_id,
        destination_hospital_id=payload.destination_hospital_id,
        pickup_address=clean_addr,
        pickup_coordinates=payload.pickup_coordinates,
        patient_condition=clean_cond
    )

    # Broadcast over WebSocket so dispatchers & drivers see real-time green preemption
    background_tasks.add_task(
        manager.broadcast,
        "GREEN_CORRIDOR_ACTIVATED",
        session.model_dump()
    )

    return session

@router.get("/ambulance/corridor/{ambulance_id}", response_model=GreenCorridorTransitSession)
async def get_active_corridor(ambulance_id: str):
    """Get active Green Corridor status for an ambulance."""
    session = db.active_corridors.get(ambulance_id)
    if not session:
        raise HTTPException(status_code=404, detail="No active Green Corridor for this ambulance")
    return session

@router.post("/citizen-snap-sos", response_model=AutoScrambleResult)
async def report_accident_by_photo(
    payload: CitizenSnapReport,
    background_tasks: BackgroundTasks
):
    """
    Bystander snaps a photo of a road accident and uploads it into the app:
    1. Gemini 3.8 Flash Multimodal Vision evaluates scene & severity.
    2. Creates new P1/P2 emergency incident.
    3. Finds closest available ambulance on duty.
    4. Instantly auto-dispatches the ambulance to the accident scene with zero delay!
    5. Returns auto-scramble telemetry and list of recommended trauma hospitals.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    new_id = f"inc-snap-{uuid.uuid4().hex[:6]}"

    clean_notes = sanitize_input_text(payload.optional_notes)
    clean_addr = sanitize_input_text(payload.location_address)
    clean_rep_name = sanitize_input_text(payload.reporter_name) or "Good Samaritan Citizen"
    clean_rep_phone = sanitize_input_text(payload.reporter_phone) or "+91 (Mobile App)"

    # Gemini Multimodal Vision Triage
    triage_result = await gemini_service.analyze_and_triage_incident(
        raw_description=f"Citizen uploaded road accident photo: {clean_notes}",
        location_address=clean_addr,
        caller_name=clean_rep_name,
        image_base64=payload.image_base64
    )

    # Ensure accident is treated as high priority
    priority = PriorityLevel.P1 if triage_result.severity_score >= 75 else PriorityLevel.P2

    # Find closest available ambulance on duty
    ambulance = dispatch_engine.find_nearest_available_ambulance(
        payload.coordinates.lat, payload.coordinates.lng
    )

    assigned_unit_id = ambulance.id if ambulance else "unit-ems-101"
    assigned_callsign = ambulance.callsign if ambulance else "108-TRAUMA-CRITICAL (Pilot Suresh)"

    # Compute distance and ETA to scene (fallback to Bengaluru center 12.9716, 77.5946)
    dist_km = dispatch_engine.calculate_haversine_distance(
        ambulance.location.lat if ambulance else 12.9716,
        ambulance.location.lng if ambulance else 77.5946,
        payload.coordinates.lat,
        payload.coordinates.lng
    ) if ambulance else 1.2
    eta_min = round(max((dist_km / 50.0) * 60.0, 1.8), 1)

    # Create incident in DB
    incident = Incident(
        id=new_id,
        title=f"Roadway Accident at {clean_addr}",
        caller_name=clean_rep_name,
        caller_phone=clean_rep_phone,
        raw_description=clean_notes or "Roadway crash reported via citizen photo capture.",
        location_address=clean_addr,
        coordinates=payload.coordinates,
        image_url=payload.image_base64 if payload.image_base64 else None,
        status=IncidentStatus.DISPATCHED,
        priority=priority,
        category=triage_result.category,
        triage=triage_result,
        assigned_unit_ids=[assigned_unit_id],
        created_at=now_iso,
        updated_at=now_iso
    )
    db.incidents[new_id] = incident

    # Auto-dispatch the ambulance
    if ambulance:
        ambulance.status = UnitStatus.EN_ROUTE
        ambulance.assigned_incident_id = new_id
        ambulance.eta_minutes = eta_min
        ambulance.speed_kmh = 60.0

    # Broadcast event
    background_tasks.add_task(
        manager.broadcast,
        "ACCIDENT_PHOTO_AUTO_SCRAMBLE",
        {
            "incident_id": new_id,
            "assigned_ambulance": assigned_callsign,
            "eta_minutes": eta_min
        }
    )

    return AutoScrambleResult(
        incident_id=new_id,
        incident_title=incident.title,
        priority=priority,
        severity_score=triage_result.severity_score,
        assigned_ambulance_id=assigned_unit_id,
        assigned_ambulance_callsign=assigned_callsign,
        distance_km=dist_km,
        eta_minutes=eta_min,
        auto_dispatched_at=now_iso,
        triage_summary=triage_result.reasoning_summary,
        available_hospitals=list(db.hospitals.values())
    )


# --- Shortest Path, Nearest Hospital & Traffic-Free Road Routing Endpoints ---

@router.post("/routing/nearest-hospital", response_model=HospitalRoutingResponse)
async def get_nearest_hospital_routing(payload: HospitalRoutingRequest):
    """
    Finds shortest path for nearest hospital, computes route options (AI Green Corridor,
    Traffic-Free Bypass, Shortest Distance Path), and returns live traffic road states.
    """
    clean_addr = sanitize_input_text(payload.pickup_address)
    clean_cond = sanitize_input_text(payload.patient_condition)
    return routing_engine.calculate_hospital_routes(
        pickup_address=clean_addr,
        pickup_coordinates=payload.pickup_coordinates,
        ambulance_id=payload.ambulance_id,
        patient_condition=clean_cond
    )


@router.get("/routing/roads", response_model=List[RoadSegment])
async def list_road_traffic_conditions():
    """
    Retrieve all metropolitan roadway segments with live traffic congestion telemetry,
    including designated traffic-free elevated expressways, bypasses, and choke points.
    """
    return list(db.road_segments.values())


@router.post("/routing/driver/accept-route", response_model=DriverRouteAcceptanceResponse)
async def driver_accept_route(
    payload: DriverRouteAcceptanceRequest,
    background_tasks: BackgroundTasks
):
    """
    Allows the ambulance driver / pilot to accept the recommended route or choose an alternative
    (e.g., Traffic-Free Bypass or Shortest Distance Path).
    Updates corridor signals, adjusts hospital ER arrival ETA, and notifies operations.
    """
    clean_addr = sanitize_input_text(payload.pickup_address)
    clean_cond = sanitize_input_text(payload.patient_condition)
    clean_notes = sanitize_input_text(payload.driver_notes)

    response = routing_engine.driver_accept_route(
        ambulance_id=payload.ambulance_id,
        destination_hospital_id=payload.destination_hospital_id,
        chosen_route_id=payload.chosen_route_id,
        pickup_address=clean_addr,
        pickup_coordinates=payload.pickup_coordinates,
        patient_condition=clean_cond,
        driver_notes=clean_notes
    )

    background_tasks.add_task(
        manager.broadcast,
        "DRIVER_ROUTE_ACCEPTED",
        {
            "ambulance_id": response.ambulance_id,
            "hospital_name": response.hospital_name,
            "chosen_route_name": response.chosen_route_name,
            "eta_minutes": response.eta_minutes,
            "distance_km": response.distance_km,
            "signals_preempted": response.signals_preempted
        }
    )

    return response

