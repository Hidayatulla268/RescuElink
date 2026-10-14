from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PriorityLevel(str, Enum):
    P1 = "P1"  # Critical Life Threat
    P2 = "P2"  # Urgent / Structural / Severe
    P3 = "P3"  # Moderate / Controlled
    P4 = "P4"  # Advisory / Minor

class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    TRIAGED = "TRIAGED"
    DISPATCHED = "DISPATCHED"
    ON_SCENE = "ON_SCENE"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class IncidentCategory(str, Enum):
    FIRE_EXPLOSION = "FIRE_EXPLOSION"
    MEDICAL_TRAUMA = "MEDICAL_TRAUMA"
    FLOOD_WATER = "FLOOD_WATER"
    STRUCTURAL_COLLAPSE = "STRUCTURAL_COLLAPSE"
    HAZMAT_SPILL = "HAZMAT_SPILL"
    TRAFFIC_COLLISION = "TRAFFIC_COLLISION"
    CIVIL_SAFETY = "CIVIL_SAFETY"

class UnitType(str, Enum):
    AMBULANCE_PARAMEDIC = "AMBULANCE_PARAMEDIC"
    FIRE_ENGINE = "FIRE_ENGINE"
    DRONE_AERIAL_RECON = "DRONE_AERIAL_RECON"
    HEAVY_RESCUE = "HEAVY_RESCUE"
    POLICE_TACTICAL = "POLICE_TACTICAL"

class UnitStatus(str, Enum):
    IDLE = "IDLE"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    RETURNING = "RETURNING"
    OFFLINE = "OFFLINE"

class Coordinates(BaseModel):
    lat: float
    lng: float

class ResponderUnit(BaseModel):
    id: str
    callsign: str
    type: UnitType
    status: UnitStatus
    location: Coordinates
    speed_kmh: float = 0.0
    assigned_incident_id: Optional[str] = None
    eta_minutes: Optional[float] = None
    battery_or_fuel_pct: int = 100
    personnel_count: int = 2

class SensorType(str, Enum):
    FLOOD_DEPTH = "FLOOD_DEPTH"
    AIR_QUALITY_AQI = "AIR_QUALITY_AQI"
    THERMAL_HEAT = "THERMAL_HEAT"
    SEISMIC_TREMOR = "SEISMIC_TREMOR"
    TRAFFIC_CONGESTION = "TRAFFIC_CONGESTION"

class SensorAlertStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class IoTSensor(BaseModel):
    id: str
    name: str
    type: SensorType
    location: Coordinates
    value: float
    unit: str
    threshold: float
    status: SensorAlertStatus
    last_updated: str

class AITriageResult(BaseModel):
    severity_score: int = Field(ge=1, le=100, description="Severity score from 1 (lowest) to 100 (catastrophic)")
    priority: PriorityLevel
    category: IncidentCategory
    estimated_victims: int = 0
    detected_hazards: List[str] = []
    standard_operating_procedures: List[str] = []
    recommended_units: List[str] = []
    reasoning_summary: str
    evacuation_radius_meters: int = 100
    confidence_score: float = 0.95

class IncidentCreate(BaseModel):
    title: str
    caller_phone: Optional[str] = "911-Dispatcher"
    caller_name: Optional[str] = "Anonymous Citizen"
    raw_description: str
    location_address: str
    coordinates: Coordinates
    image_base64: Optional[str] = None
    reported_category: Optional[str] = None

class Incident(BaseModel):
    id: str
    title: str
    caller_name: str
    caller_phone: str
    raw_description: str
    location_address: str
    coordinates: Coordinates
    image_url: Optional[str] = None
    status: IncidentStatus = IncidentStatus.REPORTED
    priority: PriorityLevel = PriorityLevel.P2
    category: IncidentCategory = IncidentCategory.FIRE_EXPLOSION
    triage: Optional[AITriageResult] = None
    assigned_unit_ids: List[str] = []
    created_at: str
    updated_at: str

class DispatchActionRequest(BaseModel):
    incident_id: str
    unit_ids: List[str]

class CitizenBroadcastRequest(BaseModel):
    incident_id: str
    target_radius_meters: int = 1500
    languages: List[str] = ["English", "Spanish", "Hindi", "French"]
    advisory_type: str = "EVACUATION_OR_SHELTER"

class CitizenBroadcastResponse(BaseModel):
    incident_id: str
    title: str
    generated_alerts: Dict[str, str]
    first_aid_guidance: List[str]
    evacuation_corridor: str
    channels_notified: List[str]
    broadcast_timestamp: str

class UrbanRiskMetrics(BaseModel):
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
    RED = "RED"
    GREEN = "GREEN"
    EMERGENCY_OVERRIDE = "EMERGENCY_OVERRIDE"

class TrafficSignal(BaseModel):
    id: str
    intersection_name: str
    coordinates: Coordinates
    state: TrafficSignalState = TrafficSignalState.RED
    is_overridden: bool = False
    distance_to_active_ambulance_km: Optional[float] = None
    cleared_for_ambulance_id: Optional[str] = None
    last_state_change: str = ""

class Hospital(BaseModel):
    id: str
    name: str
    address: str
    coordinates: Coordinates
    trauma_level: str  # "Level 1 Trauma Center", "Level 2 Comprehensive", "Urgent Care"
    total_beds: int
    available_beds: int
    icu_capacity: int
    phone: str
    trauma_team_status: str  # "STANDBY", "ACTIVATED_PREPARING_BAY", "BUSY"
    assigned_trauma_bay: Optional[str] = None
    er_preparedness_notes: List[str] = []

class GreenCorridorTransitRequest(BaseModel):
    ambulance_id: str
    destination_hospital_id: str
    pickup_address: str
    pickup_coordinates: Coordinates
    patient_condition: str = "Acute Polytrauma / Severe Hemodynamic Instability"
    trauma_level_needed: str = "Level 1 Trauma"

class GreenCorridorTransitSession(BaseModel):
    id: str
    ambulance_id: str
    ambulance_callsign: str
    destination_hospital_id: str
    hospital_name: str
    pickup_address: str
    status: str  # "ACTIVE_EN_ROUTE", "APPROACHING_ER", "PATIENT_HANDED_OVER", "COMPLETED"
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
    image_base64: str
    location_address: str
    coordinates: Coordinates
    reporter_name: Optional[str] = "Good Samaritan Citizen"
    reporter_phone: Optional[str] = "Mobile-App-Upload"
    optional_notes: Optional[str] = "Accident on roadway, vehicle deformation with injured persons."

class AutoScrambleResult(BaseModel):
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

