"""
Pydantic v2 schemas for RescuELINK: Autonomous Smart City Emergency Dispatch & Urban Resilience Command System.
Provides strict validation, data serialization, and API contract enforcement.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PriorityLevel(str, Enum):
    """Emergency incident triage priority tiers."""
    P1 = "P1"  # Critical Life Threat / Imminent Hazard
    P2 = "P2"  # Urgent / Structural / Severe
    P3 = "P3"  # Moderate / Controlled
    P4 = "P4"  # Advisory / Minor


class IncidentStatus(str, Enum):
    """Lifecycle states of a reported municipal emergency incident."""
    REPORTED = "REPORTED"
    TRIAGED = "TRIAGED"
    DISPATCHED = "DISPATCHED"
    ON_SCENE = "ON_SCENE"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class IncidentCategory(str, Enum):
    """Primary hazard categorization determined by Gemini multimodal triage."""
    FIRE_EXPLOSION = "FIRE_EXPLOSION"
    MEDICAL_TRAUMA = "MEDICAL_TRAUMA"
    FLOOD_WATER = "FLOOD_WATER"
    STRUCTURAL_COLLAPSE = "STRUCTURAL_COLLAPSE"
    HAZMAT_SPILL = "HAZMAT_SPILL"
    TRAFFIC_COLLISION = "TRAFFIC_COLLISION"
    CIVIL_SAFETY = "CIVIL_SAFETY"


class UnitType(str, Enum):
    """First responder vehicle and operational asset classifications."""
    AMBULANCE_PARAMEDIC = "AMBULANCE_PARAMEDIC"
    FIRE_ENGINE = "FIRE_ENGINE"
    DRONE_AERIAL_RECON = "DRONE_AERIAL_RECON"
    HEAVY_RESCUE = "HEAVY_RESCUE"
    POLICE_TACTICAL = "POLICE_TACTICAL"


class UnitStatus(str, Enum):
    """Real-time operational status of emergency fleet units."""
    IDLE = "IDLE"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    RETURNING = "RETURNING"
    OFFLINE = "OFFLINE"


class Coordinates(BaseModel):
    """Geographic GPS coordinates with boundary validation."""
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")


class ResponderUnit(BaseModel):
    """First responder unit profile, telemetry, and availability."""
    id: str = Field(..., description="Unique unit identifier")
    callsign: str = Field(..., description="Tactical radio callsign")
    type: UnitType = Field(..., description="Unit operational type")
    status: UnitStatus = Field(..., description="Current operational status")
    location: Coordinates = Field(..., description="Current GPS coordinates")
    speed_kmh: float = Field(default=0.0, ge=0.0, description="Speed in km/h")
    assigned_incident_id: Optional[str] = Field(default=None, description="Active assigned incident ID")
    eta_minutes: Optional[float] = Field(default=None, ge=0.0, description="Estimated arrival time in minutes")
    battery_or_fuel_pct: int = Field(default=100, ge=0, le=100, description="Battery or fuel percentage")
    personnel_count: int = Field(default=2, ge=1, description="Active crew count on board")


class SensorType(str, Enum):
    """Smart city IoT environmental sensor classifications."""
    FLOOD_DEPTH = "FLOOD_DEPTH"
    AIR_QUALITY_AQI = "AIR_QUALITY_AQI"
    THERMAL_HEAT = "THERMAL_HEAT"
    SEISMIC_TREMOR = "SEISMIC_TREMOR"
    TRAFFIC_CONGESTION = "TRAFFIC_CONGESTION"


class SensorAlertStatus(str, Enum):
    """Threshold alert levels for smart city IoT telemetry."""
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class IoTSensor(BaseModel):
    """Smart city IoT sensor node telemetry and threshold monitoring."""
    id: str = Field(..., description="Sensor hardware identifier")
    name: str = Field(..., description="Sensor descriptive location name")
    type: SensorType = Field(..., description="Environmental measurement type")
    location: Coordinates = Field(..., description="Sensor GPS coordinates")
    value: float = Field(..., description="Current telemetry reading")
    unit: str = Field(..., description="Unit of measurement (m, AQI, °C, %)")
    threshold: float = Field(..., description="Critical warning threshold")
    status: SensorAlertStatus = Field(..., description="Active warning status")
    last_updated: str = Field(..., description="ISO 8601 timestamp of last telemetry pulse")


class AITriageResult(BaseModel):
    """Google Gemini 3.8 Flash multimodal emergency incident analysis."""
    severity_score: int = Field(..., ge=1, le=100, description="Severity score from 1 to 100")
    priority: PriorityLevel = Field(..., description="Assigned triage priority tier")
    category: IncidentCategory = Field(..., description="Identified incident hazard category")
    estimated_victims: int = Field(default=0, ge=0, description="Estimated affected persons")
    detected_hazards: List[str] = Field(default_factory=list, description="Specific hazards detected on scene")
    standard_operating_procedures: List[str] = Field(default_factory=list, description="Immediate dispatch action items")
    recommended_units: List[str] = Field(default_factory=list, description="Recommended emergency asset types")
    reasoning_summary: str = Field(..., description="AI analytical justification")
    evacuation_radius_meters: int = Field(default=100, ge=0, description="Safety perimeter radius in meters")
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0, description="AI model confidence score")


class IncidentCreate(BaseModel):
    """Payload for submitting a new emergency incident."""
    title: Optional[str] = Field(default=None, description="Optional incident headline")
    caller_phone: Optional[str] = Field(default="112-Intake", description="Reporter contact phone")
    caller_name: Optional[str] = Field(default="Anonymous Citizen", description="Reporter identity")
    raw_description: str = Field(..., min_length=5, description="Detailed emergency description")
    location_address: str = Field(..., min_length=3, description="Street address or landmark")
    coordinates: Coordinates = Field(..., description="Incident GPS location")
    image_base64: Optional[str] = Field(default=None, description="Optional base64 accident photo")
    reported_category: Optional[str] = Field(default=None, description="Optional caller-reported category")


class Incident(BaseModel):
    """Full incident record with assigned assets and AI triage details."""
    id: str = Field(..., description="Unique incident identifier")
    title: str = Field(..., description="Incident title")
    caller_name: str = Field(..., description="Caller name")
    caller_phone: str = Field(..., description="Caller phone")
    raw_description: str = Field(..., description="Incident description")
    location_address: str = Field(..., description="Location address")
    coordinates: Coordinates = Field(..., description="Incident coordinates")
    image_url: Optional[str] = Field(default=None, description="Attached image URL or preview snippet")
    status: IncidentStatus = Field(default=IncidentStatus.REPORTED, description="Current lifecycle state")
    priority: PriorityLevel = Field(default=PriorityLevel.P2, description="Triage priority level")
    category: IncidentCategory = Field(default=IncidentCategory.FIRE_EXPLOSION, description="Hazard category")
    triage: Optional[AITriageResult] = Field(default=None, description="Gemini AI triage analysis")
    assigned_unit_ids: List[str] = Field(default_factory=list, description="Dispatched unit identifiers")
    created_at: str = Field(..., description="Creation ISO timestamp")
    updated_at: str = Field(..., description="Last modification ISO timestamp")


class DispatchActionRequest(BaseModel):
    """Request payload to dispatch units to an active incident."""
    incident_id: str = Field(..., description="Target incident ID")
    unit_ids: List[str] = Field(..., min_length=1, description="List of unit IDs to mobilize")


class CitizenBroadcastRequest(BaseModel):
    """Request payload to generate multilingual citizen crisis alerts."""
    incident_id: str = Field(..., description="Incident ID requiring civic alert")
    target_radius_meters: int = Field(default=1500, ge=100, description="Broadcast geo-fence radius")
    languages: List[str] = Field(default_factory=lambda: ["Hindi", "Kannada", "Tamil", "English"], description="Target languages")
    advisory_type: str = Field(default="EVACUATION_OR_SHELTER", description="Advisory category")


class CitizenBroadcastResponse(BaseModel):
    """Generated multilingual citizen broadcast alert packet."""
    incident_id: str
    title: str
    generated_alerts: Dict[str, str]
    first_aid_guidance: List[str]
    evacuation_corridor: str
    channels_notified: List[str]
    broadcast_timestamp: str


class UrbanRiskMetrics(BaseModel):
    """Municipal resilience index, high-risk zones, and response timeline."""
    active_incidents_count: int
    p1_critical_count: int
    available_units_count: int
    average_dispatch_eta_minutes: float
    sensor_alert_count: int
    overall_city_resilience_score: float
    high_risk_zones: List[Dict[str, Any]]
    incident_timeline: List[Dict[str, Any]]


# --- Green Corridor, Smart Traffic Signals & Hospital ER Readiness Models ---

class TrafficSignalState(str, Enum):
    """Traffic junction signaling states."""
    RED = "RED"
    GREEN = "GREEN"
    EMERGENCY_OVERRIDE = "EMERGENCY_OVERRIDE"


class TrafficSignal(BaseModel):
    """Smart city IoT traffic signal junction."""
    id: str = Field(..., description="Signal junction ID")
    intersection_name: str = Field(..., description="Junction name or road crossing")
    coordinates: Coordinates = Field(..., description="GPS location of intersection")
    state: TrafficSignalState = Field(default=TrafficSignalState.RED, description="Current light state")
    is_overridden: bool = Field(default=False, description="Emergency green override active")
    distance_to_active_ambulance_km: Optional[float] = Field(default=None, description="Distance to en-route ambulance")
    cleared_for_ambulance_id: Optional[str] = Field(default=None, description="Ambulance unit holding green override")
    last_state_change: str = Field(default="", description="Timestamp of last light transition")


class Hospital(BaseModel):
    """Metropolitan trauma center emergency department profile."""
    id: str = Field(..., description="Hospital identifier")
    name: str = Field(..., description="Hospital full legal name")
    address: str = Field(..., description="Street address")
    coordinates: Coordinates = Field(..., description="Hospital GPS location")
    trauma_level: str = Field(..., description="Trauma certification level")
    total_beds: int = Field(..., ge=0, description="Total bed capacity")
    available_beds: int = Field(..., ge=0, description="Immediately available emergency beds")
    icu_capacity: int = Field(..., ge=0, description="Intensive Care Unit capacity")
    phone: str = Field(..., description="Direct emergency department phone")
    trauma_team_status: str = Field(default="STANDBY", description="Surgeon and trauma team status")
    assigned_trauma_bay: Optional[str] = Field(default=None, description="Designated sterile trauma bay")
    er_preparedness_notes: List[str] = Field(default_factory=list, description="ER pre-arrival staging notes")


class GreenCorridorTransitRequest(BaseModel):
    """Request to initiate a Green Corridor for critical patient transit."""
    ambulance_id: str = Field(..., description="Assigned ambulance unit ID")
    destination_hospital_id: str = Field(..., description="Receiving trauma center ID")
    pickup_address: str = Field(..., description="Patient pickup street location")
    pickup_coordinates: Coordinates = Field(..., description="Pickup GPS coordinates")
    patient_condition: str = Field(default="Acute Polytrauma / Severe Hemodynamic Instability")
    trauma_level_needed: str = Field(default="Level 1 Trauma")


class GreenCorridorTransitSession(BaseModel):
    """Active Green Corridor operational session record."""
    id: str
    ambulance_id: str
    ambulance_callsign: str
    destination_hospital_id: str
    hospital_name: str
    pickup_address: str
    status: str
    active_signals_cleared: int
    total_signals_in_corridor: int
    eta_minutes: float
    route_clearance_broadcast_sent: bool
    er_preparedness_status: str
    corridor_waypoints: List[Coordinates]
    signals: List[TrafficSignal]
    start_time: str
    last_updated: str


class CitizenSnapReport(BaseModel):
    """Citizen bystander road accident photo reporting intake."""
    image_base64: str = Field(..., description="Base64 encoded crash scene photo")
    location_address: str = Field(..., description="Roadway crash address")
    coordinates: Coordinates = Field(..., description="Accident GPS coordinates")
    reporter_name: Optional[str] = Field(default="Good Samaritan Citizen")
    reporter_phone: Optional[str] = Field(default="+91 (Mobile App)")
    optional_notes: Optional[str] = Field(default="Accident on roadway, vehicle deformation with injured persons.")


class AutoScrambleResult(BaseModel):
    """Response returned upon automatic nearest-ambulance mobilization."""
    incident_id: str
    incident_title: str
    priority: PriorityLevel
    severity_score: int
    assigned_ambulance_id: str
    assigned_ambulance_callsign: str
    distance_km: float
    eta_minutes: float
    auto_dispatched_at: str
    triage_summary: str
    available_hospitals: List[Hospital]


# --- Shortest Path, Hospital Routing & Traffic-Free Road Models ---

class RoadCongestionLevel(str, Enum):
    """Traffic congestion grading across metropolitan roadway segments."""
    TRAFFIC_FREE = "TRAFFIC_FREE"          # Green flow (> 60 km/h, 0-20% congestion)
    MODERATE = "MODERATE"                  # Yellow flow (30-50 km/h, 20-60% congestion)
    HEAVY_GRIDLOCK = "HEAVY_GRIDLOCK"      # Red gridlock (< 15 km/h, > 60% congestion)


class RoadSegment(BaseModel):
    """Metropolitan road corridor segment with live traffic congestion telemetry."""
    id: str = Field(..., description="Unique road segment identifier")
    name: str = Field(..., description="Road or highway corridor name")
    corridor_type: str = Field(..., description="ELEVATED_EXPRESSWAY, RING_ROAD_BYPASS, ARTERIAL, or SURFACE_JUNCTION")
    congestion_level: RoadCongestionLevel = Field(..., description="Live traffic congestion level")
    current_speed_kmh: float = Field(..., description="Observed traffic speed in km/h")
    is_traffic_free: bool = Field(..., description="True if free-flowing without bottleneck delays")
    delay_minutes: float = Field(default=0.0, description="Estimated delay relative to free flow")
    coordinates_start: Coordinates = Field(..., description="Segment start GPS coordinate")
    coordinates_end: Coordinates = Field(..., description="Segment end GPS coordinate")
    description: str = Field(default="", description="Traffic condition summary")


class HospitalRouteOption(BaseModel):
    """Route option calculated from incident pickup to receiving trauma hospital."""
    route_id: str = Field(..., description="Unique route option identifier (e.g., route-green-corridor)")
    route_name: str = Field(..., description="Display route title")
    route_type: str = Field(..., description="AI_GREEN_CORRIDOR, TRAFFIC_FREE_BYPASS, or SHORTEST_DISTANCE")
    is_recommended: bool = Field(default=False, description="Whether AI recommends this as the optimal choice")
    distance_km: float = Field(..., description="Total route distance in kilometers")
    estimated_minutes_normal: float = Field(..., description="Transit time under regular traffic")
    estimated_minutes_preempted: float = Field(..., description="Transit time with Green Corridor AI preemption")
    time_saved_minutes: float = Field(..., description="Time saved compared to normal transit")
    congestion_score_pct: int = Field(..., description="Congestion percentage (0% = totally traffic free)")
    traffic_free_pct: int = Field(..., description="Percentage of route consisting of traffic-free roads")
    signals_count: int = Field(..., description="Number of traffic signals on this route")
    signals_preempted_count: int = Field(..., description="Number of signals cleared to 100% GREEN")
    via_roads: List[str] = Field(default_factory=list, description="Sequence of road segments traversed")
    waypoints: List[Coordinates] = Field(default_factory=list, description="GPS waypoints along the route polyline")
    driver_pros: List[str] = Field(default_factory=list, description="Operational advantages for driver")
    driver_cons: List[str] = Field(default_factory=list, description="Trade-offs or considerations for driver")


class HospitalRecommendation(BaseModel):
    """Hospital candidate ranked by distance, travel time, ER beds, and route options."""
    hospital: Hospital
    distance_km: float
    shortest_travel_time_minutes: float
    trauma_bay_ready: bool
    icu_available: int
    bed_availability_score: int
    overall_score: float
    is_nearest: bool
    is_recommended: bool
    route_options: List[HospitalRouteOption]


class HospitalRoutingRequest(BaseModel):
    """Request payload to calculate nearest hospital and multiple route paths."""
    pickup_address: str = Field(..., description="Patient / accident pickup address")
    pickup_coordinates: Coordinates = Field(..., description="Pickup GPS coordinates")
    ambulance_id: Optional[str] = Field(default=None, description="Active ambulance unit ID")
    patient_condition: Optional[str] = Field(default="Severe Trauma / Polytrauma", description="Patient status")


class HospitalRoutingResponse(BaseModel):
    """Complete routing recommendation with nearest hospital, alternatives & traffic roads."""
    pickup_address: str
    pickup_coordinates: Coordinates
    nearest_hospital: HospitalRecommendation
    recommended_hospital: HospitalRecommendation
    all_hospitals: List[HospitalRecommendation]
    active_traffic_free_roads: List[RoadSegment]
    congested_roads: List[RoadSegment]


class DriverRouteAcceptanceRequest(BaseModel):
    """Payload sent when ambulance driver accepts or changes their active transit route."""
    ambulance_id: str
    destination_hospital_id: str
    chosen_route_id: str
    pickup_address: str
    pickup_coordinates: Coordinates
    patient_condition: Optional[str] = "Acute Trauma"
    driver_notes: Optional[str] = "Confirmed on In-Cab Terminal by Ambulance Driver"


class DriverRouteAcceptanceResponse(BaseModel):
    """Response returned upon driver route confirmation."""
    success: bool
    message: str
    ambulance_id: str
    hospital_id: str
    hospital_name: str
    chosen_route_id: str
    chosen_route_name: str
    eta_minutes: float
    distance_km: float
    signals_preempted: int
    session: GreenCorridorTransitSession

