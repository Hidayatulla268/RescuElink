export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type IncidentStatus = 
  | 'REPORTED'
  | 'TRIAGED'
  | 'DISPATCHED'
  | 'ON_SCENE'
  | 'RESOLVED'
  | 'CANCELLED';

export type IncidentCategory = 
  | 'FIRE_EXPLOSION'
  | 'MEDICAL_TRAUMA'
  | 'FLOOD_WATER'
  | 'STRUCTURAL_COLLAPSE'
  | 'HAZMAT_SPILL'
  | 'TRAFFIC_COLLISION'
  | 'CIVIL_SAFETY';

export type UnitType = 
  | 'AMBULANCE_PARAMEDIC'
  | 'FIRE_ENGINE'
  | 'DRONE_AERIAL_RECON'
  | 'HEAVY_RESCUE'
  | 'POLICE_TACTICAL';

export type UnitStatus = 
  | 'IDLE'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'RETURNING'
  | 'OFFLINE';

export interface Coordinates {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
}

export interface ResponderUnit {
  id: string;
  callsign: string;
  type: UnitType;
  status: UnitStatus;
  location: Coordinates;
  speed_kmh: number;
  assigned_incident_id?: string | null;
  eta_minutes?: number | null;
  battery_or_fuel_pct: number;
  personnel_count: number;
}

export type SensorType = 
  | 'FLOOD_DEPTH'
  | 'AIR_QUALITY_AQI'
  | 'THERMAL_HEAT'
  | 'SEISMIC_TREMOR'
  | 'TRAFFIC_CONGESTION';

export type SensorAlertStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface IoTSensor {
  id: string;
  name: string;
  type: SensorType;
  location: Coordinates;
  value: number;
  unit: string;
  threshold: number;
  status: SensorAlertStatus;
  last_updated: string;
}

export interface AITriageResult {
  severity_score: number;
  priority: PriorityLevel;
  category: IncidentCategory;
  estimated_victims: number;
  detected_hazards: string[];
  standard_operating_procedures: string[];
  recommended_units: string[];
  reasoning_summary: string;
  evacuation_radius_meters: number;
  confidence_score: number;
}

export interface Incident {
  id: string;
  title: string;
  caller_name: string;
  caller_phone: string;
  raw_description: string;
  location_address: string;
  coordinates: Coordinates;
  image_url?: string | null;
  status: IncidentStatus;
  priority: PriorityLevel;
  category: IncidentCategory;
  triage?: AITriageResult | null;
  assigned_unit_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface IncidentCreatePayload {
  title: string;
  caller_phone?: string;
  caller_name?: string;
  raw_description: string;
  location_address: string;
  coordinates: Coordinates;
  image_base64?: string | null;
  reported_category?: string;
}

export interface UnitRecommendation {
  unit_id: string;
  callsign: string;
  type: string;
  current_status: string;
  distance_km: number;
  estimated_eta_minutes: number;
  fit_score: number;
  battery_or_fuel_pct: number;
  personnel_count: number;
  rationale: string;
}

export interface RecommendationsResponse {
  incident_id: string;
  priority: string;
  category: string;
  recommended_units: UnitRecommendation[];
}

export interface CitizenBroadcastResponse {
  incident_id: string;
  title: string;
  generated_alerts: Record<string, string>;
  first_aid_guidance: string[];
  evacuation_corridor: string;
  channels_notified: string[];
  broadcast_timestamp: string;
}

export interface UrbanRiskMetrics {
  active_incidents_count: number;
  p1_critical_count: number;
  available_units_count: number;
  average_dispatch_eta_minutes: number;
  sensor_alert_count: number;
  overall_city_resilience_score: number;
  high_risk_zones: Array<{
    zone_id: string;
    name: string;
    threat_level: string;
    active_hazards: string[];
    vulnerability_index: number;
    population_density: string;
  }>;
  incident_timeline: Array<{
    time: string;
    incident_count: number;
    avg_response_min: number;
  }>;
}

// --- Green Corridor, Traffic Signals & Hospital ER Readiness ---

export type TrafficSignalState = 'RED' | 'GREEN' | 'EMERGENCY_OVERRIDE';

export interface TrafficSignal {
  id: string;
  intersection_name: string;
  coordinates: Coordinates;
  state: TrafficSignalState;
  is_overridden: boolean;
  distance_to_active_ambulance_km?: number | null;
  cleared_for_ambulance_id?: string | null;
  last_state_change: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  trauma_level: string;
  total_beds: number;
  available_beds: number;
  icu_capacity: number;
  phone: string;
  trauma_team_status: string;
  assigned_trauma_bay?: string | null;
  er_preparedness_notes: string[];
}

export interface GreenCorridorTransitRequest {
  ambulance_id: string;
  destination_hospital_id: string;
  pickup_address: string;
  pickup_coordinates: Coordinates;
  patient_condition?: string;
  trauma_level_needed?: string;
}

export interface GreenCorridorTransitSession {
  id: string;
  ambulance_id: string;
  ambulance_callsign: string;
  destination_hospital_id: string;
  hospital_name: string;
  pickup_address: string;
  status: string;
  active_signals_cleared: number;
  total_signals_in_corridor: number;
  eta_minutes: number;
  route_clearance_broadcast_sent: boolean;
  er_preparedness_status: string;
  corridor_waypoints: Coordinates[];
  signals: TrafficSignal[];
  start_time: string;
  last_updated: string;
}

export interface CitizenSnapReport {
  image_base64: string;
  location_address: string;
  coordinates: Coordinates;
  reporter_name?: string;
  reporter_phone?: string;
  optional_notes?: string;
}

export interface AutoScrambleResult {
  incident_id: string;
  incident_title: string;
  priority: PriorityLevel;
  severity_score: number;
  assigned_ambulance_id: string;
  assigned_ambulance_callsign: string;
  distance_km: number;
  eta_minutes: number;
  auto_dispatched_at: string;
  triage_summary: string;
  available_hospitals: Hospital[];
}

export type ViewMode = 'web' | 'mobile';

export type GovernmentRole = 
  | 'AMBULANCE_DRIVER'
  | 'FIRE_OFFICER'
  | 'POLICE_OFFICER'
  | 'HOSPITAL_TRAUMA_CHIEF'
  | 'CITY_DISPATCH_OPERATOR';

export interface GovernmentUser {
  id: string;
  badgeNumber: string;
  fullName: string;
  role: GovernmentRole;
  roleTitle: string;
  agencyName: string;
  callsign?: string;
  assignedUnitId?: string;
  assignedHospitalId?: string;
  clearanceLevel: string;
  loggedAt: string;
}

// --- Shortest Path, Hospital Routing & Traffic-Free Roads Types ---

export type RoadCongestionLevel = 'TRAFFIC_FREE' | 'MODERATE' | 'HEAVY_GRIDLOCK';

export interface RoadSegment {
  id: string;
  name: string;
  corridor_type: string;
  congestion_level: RoadCongestionLevel;
  current_speed_kmh: number;
  is_traffic_free: bool | boolean;
  delay_minutes: number;
  coordinates_start: Coordinates;
  coordinates_end: Coordinates;
  description: string;
}

export interface HospitalRouteOption {
  route_id: string;
  route_name: string;
  route_type: 'AI_GREEN_CORRIDOR' | 'TRAFFIC_FREE_BYPASS' | 'SHORTEST_DISTANCE' | string;
  is_recommended: boolean;
  distance_km: number;
  estimated_minutes_normal: number;
  estimated_minutes_preempted: number;
  time_saved_minutes: number;
  congestion_score_pct: number;
  traffic_free_pct: number;
  signals_count: number;
  signals_preempted_count: number;
  via_roads: string[];
  waypoints: Coordinates[];
  driver_pros: string[];
  driver_cons: string[];
}

export interface HospitalRecommendation {
  hospital: Hospital;
  distance_km: number;
  shortest_travel_time_minutes: number;
  trauma_bay_ready: boolean;
  icu_available: number;
  bed_availability_score: number;
  overall_score: number;
  is_nearest: boolean;
  is_recommended: boolean;
  route_options: HospitalRouteOption[];
}

export interface HospitalRoutingRequest {
  pickup_address: string;
  pickup_coordinates: Coordinates;
  ambulance_id?: string;
  patient_condition?: string;
}

export interface HospitalRoutingResponse {
  pickup_address: string;
  pickup_coordinates: Coordinates;
  nearest_hospital: HospitalRecommendation;
  recommended_hospital: HospitalRecommendation;
  all_hospitals: HospitalRecommendation[];
  active_traffic_free_roads: RoadSegment[];
  congested_roads: RoadSegment[];
}

export interface DriverRouteAcceptanceRequest {
  ambulance_id: string;
  destination_hospital_id: string;
  chosen_route_id: string;
  pickup_address: string;
  pickup_coordinates: Coordinates;
  patient_condition?: string;
  driver_notes?: string;
}

export interface DriverRouteAcceptanceResponse {
  success: boolean;
  message: string;
  ambulance_id: string;
  hospital_id: string;
  hospital_name: string;
  chosen_route_id: string;
  chosen_route_name: string;
  eta_minutes: number;
  distance_km: number;
  signals_preempted: number;
  session: GreenCorridorTransitSession;
}


