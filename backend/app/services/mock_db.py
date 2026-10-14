import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.models.schemas import (
    Incident, IncidentCreate, IncidentStatus, PriorityLevel, IncidentCategory,
    Coordinates, ResponderUnit, UnitType, UnitStatus, IoTSensor, SensorType,
    SensorAlertStatus, AITriageResult, Hospital, TrafficSignal, TrafficSignalState,
    GreenCorridorTransitSession
)

class Database:
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.units: Dict[str, ResponderUnit] = {}
        self.sensors: Dict[str, IoTSensor] = {}
        self.hospitals: Dict[str, Hospital] = {}
        self.traffic_signals: Dict[str, TrafficSignal] = {}
        self.active_corridors: Dict[str, GreenCorridorTransitSession] = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        # 1. Seed Responder Units
        initial_units = [
            ResponderUnit(
                id="unit-ems-101",
                callsign="MEDIC-101",
                type=UnitType.AMBULANCE_PARAMEDIC,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7749, lng=-122.4194),
                speed_kmh=0.0,
                battery_or_fuel_pct=94,
                personnel_count=2
            ),
            ResponderUnit(
                id="unit-ems-104",
                callsign="MEDIC-104 (Trauma)",
                type=UnitType.AMBULANCE_PARAMEDIC,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7833, lng=-122.4167),
                speed_kmh=0.0,
                battery_or_fuel_pct=88,
                personnel_count=3
            ),
            ResponderUnit(
                id="unit-fire-201",
                callsign="ENGINE-201 (Ladder)",
                type=UnitType.FIRE_ENGINE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7699, lng=-122.4469),
                speed_kmh=0.0,
                battery_or_fuel_pct=91,
                personnel_count=4
            ),
            ResponderUnit(
                id="unit-fire-205",
                callsign="HAZMAT-205",
                type=UnitType.FIRE_ENGINE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7550, lng=-122.4180),
                speed_kmh=0.0,
                battery_or_fuel_pct=96,
                personnel_count=4
            ),
            ResponderUnit(
                id="unit-drone-301",
                callsign="SKYSCAN-ALPHA (Drone)",
                type=UnitType.DRONE_AERIAL_RECON,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7785, lng=-122.4056),
                speed_kmh=0.0,
                battery_or_fuel_pct=99,
                personnel_count=1
            ),
            ResponderUnit(
                id="unit-drone-302",
                callsign="SKYSCAN-BRAVO (Thermal)",
                type=UnitType.DRONE_AERIAL_RECON,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7610, lng=-122.4350),
                speed_kmh=0.0,
                battery_or_fuel_pct=85,
                personnel_count=1
            ),
            ResponderUnit(
                id="unit-rescue-401",
                callsign="HEAVY-RESCUE-401",
                type=UnitType.HEAVY_RESCUE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7880, lng=-122.4075),
                speed_kmh=0.0,
                battery_or_fuel_pct=82,
                personnel_count=5
            ),
            ResponderUnit(
                id="unit-tac-501",
                callsign="PATROL-501 (Rapid Response)",
                type=UnitType.POLICE_TACTICAL,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=37.7712, lng=-122.4110),
                speed_kmh=0.0,
                battery_or_fuel_pct=90,
                personnel_count=2
            ),
        ]
        for u in initial_units:
            self.units[u.id] = u

        # 2. Seed Smart City IoT Sensors
        now_iso = datetime.now(timezone.utc).isoformat()
        initial_sensors = [
            IoTSensor(
                id="sensor-f-01",
                name="Mission Creek Flood Basin Gauge",
                type=SensorType.FLOOD_DEPTH,
                location=Coordinates(lat=37.7715, lng=-122.3980),
                value=2.4,
                unit="meters",
                threshold=2.0,
                status=SensorAlertStatus.CRITICAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-f-02",
                name="Market St Storm Runoff Sensor",
                type=SensorType.FLOOD_DEPTH,
                location=Coordinates(lat=37.7810, lng=-122.4115),
                value=0.6,
                unit="meters",
                threshold=1.2,
                status=SensorAlertStatus.NORMAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-aq-01",
                name="Industrial Waterfront Air Sentinel",
                type=SensorType.AIR_QUALITY_AQI,
                location=Coordinates(lat=37.7530, lng=-122.3880),
                value=168.0,
                unit="AQI (Unhealthy)",
                threshold=100.0,
                status=SensorAlertStatus.WARNING,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-th-01",
                name="Substation 4 Thermal Grid",
                type=SensorType.THERMAL_HEAT,
                location=Coordinates(lat=37.7845, lng=-122.4010),
                value=68.5,
                unit="°C",
                threshold=60.0,
                status=SensorAlertStatus.CRITICAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-tr-01",
                name="Bay Bridge Arterial Flow Node",
                type=SensorType.TRAFFIC_CONGESTION,
                location=Coordinates(lat=37.7895, lng=-122.3890),
                value=89.0,
                unit="% Congestion",
                threshold=75.0,
                status=SensorAlertStatus.WARNING,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-se-01",
                name="Financial District Fault Seismograph",
                type=SensorType.SEISMIC_TREMOR,
                location=Coordinates(lat=37.7930, lng=-122.4005),
                value=1.8,
                unit="Richter (Micro)",
                threshold=3.5,
                status=SensorAlertStatus.NORMAL,
                last_updated=now_iso
            ),
        ]
        for s in initial_sensors:
            self.sensors[s.id] = s

        # 3. Seed Realistic Incidents
        initial_incidents = [
            Incident(
                id="inc-911-001",
                title="Industrial Complex Chemical Storage Fire",
                caller_name="Marcus Vance (Plant Safety Officer)",
                caller_phone="+1 (415) 555-0192",
                raw_description="Dense toxic chemical smoke and active blaze erupting from warehouse sector B. Stored solvents caught fire. Two staff unaccounted for. Adjacent electrical substation threatened.",
                location_address="1420 3rd St, Central Industrial Pier, Sector 4",
                coordinates=Coordinates(lat=37.7710, lng=-122.3920),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P1,
                category=IncidentCategory.HAZMAT_SPILL,
                triage=AITriageResult(
                    severity_score=94,
                    priority=PriorityLevel.P1,
                    category=IncidentCategory.HAZMAT_SPILL,
                    estimated_victims=2,
                    detected_hazards=["Toxic Solvent Combustion", "Substation Flashover Risk", "Thermal Plume Downwind"],
                    standard_operating_procedures=[
                        "Establish 500m hot-zone perimeter and upwind command post",
                        "Deploy HAZMAT Foam suppression unit immediately",
                        "Launch aerial thermal drone for plume mapping",
                        "Broadcast urgent shelter-in-place advisory to adjacent sectors"
                    ],
                    recommended_units=["HAZMAT-205", "ENGINE-201 (Ladder)", "SKYSCAN-ALPHA (Drone)", "MEDIC-104 (Trauma)"],
                    reasoning_summary="High-risk chemical fire with trapped personnel and immediate secondary infrastructure threat. High likelihood of hazardous vapor inhalation.",
                    evacuation_radius_meters=600,
                    confidence_score=0.98
                ),
                assigned_unit_ids=[],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-911-002",
                title="Subway Underpass Flash Flooding & Trapped Vehicles",
                caller_name="Elena Rostova (Transit Patrol)",
                caller_phone="+1 (415) 555-0144",
                raw_description="Rapid water accumulation in 4th St subterranean underpass exceeding 2 meters depth. Three passenger vehicles stalled with occupants climbing onto car roofs.",
                location_address="4th St Underpass at Channel Crossing",
                coordinates=Coordinates(lat=37.7735, lng=-122.3995),
                status=IncidentStatus.DISPATCHED,
                priority=PriorityLevel.P1,
                category=IncidentCategory.FLOOD_WATER,
                triage=AITriageResult(
                    severity_score=88,
                    priority=PriorityLevel.P1,
                    category=IncidentCategory.FLOOD_WATER,
                    estimated_victims=5,
                    detected_hazards=["Submerged Electrical Conduits", "Hypothermia Risk", "Vehicle Inundation"],
                    standard_operating_procedures=[
                        "Cut power to underpass drainage pump substation",
                        "Deploy Swiftwater Rescue inflatables and divers",
                        "Divert approaching arterial traffic via automated variable messaging",
                        "Prepare triage area on north embankment"
                    ],
                    recommended_units=["HEAVY-RESCUE-401", "MEDIC-101", "SKYSCAN-BRAVO (Thermal)"],
                    reasoning_summary="Active life-safety hazard with rising waters trapping multiple motorists in low elevation passage.",
                    evacuation_radius_meters=350,
                    confidence_score=0.96
                ),
                assigned_unit_ids=["unit-rescue-401"],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-911-003",
                title="Commercial High-Rise Elevator System Stall with Medical Distress",
                caller_name="Building Operations Manager",
                caller_phone="+1 (415) 555-0210",
                raw_description="Elevator Car 3 stuck between 18th and 19th floors following localized power surge. Elderly passenger reporting acute angina / chest pain.",
                location_address="555 Mission St, Financial Corridor",
                coordinates=Coordinates(lat=37.7885, lng=-122.4002),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P2,
                category=IncidentCategory.MEDICAL_TRAUMA,
                triage=AITriageResult(
                    severity_score=76,
                    priority=PriorityLevel.P2,
                    category=IncidentCategory.MEDICAL_TRAUMA,
                    estimated_victims=1,
                    detected_hazards=["Elevator Shaft Access Restriction", "Cardiac Event Escalation"],
                    standard_operating_procedures=[
                        "Dispatch Advanced Life Support (ALS) paramedic crew",
                        "Coordinate elevator machine room override with building engineer",
                        "Bring portable defibrillator and extrication harness"
                    ],
                    recommended_units=["MEDIC-104 (Trauma)", "PATROL-501 (Rapid Response)"],
                    reasoning_summary="Urgent medical situation complicated by mechanical entrapment at height. Rapid technical extrication required.",
                    evacuation_radius_meters=50,
                    confidence_score=0.92
                ),
                assigned_unit_ids=[],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-911-004",
                title="Downtown Multi-Vehicle Collision & Fuel Leakage",
                caller_name="Citizen Motorist",
                caller_phone="+1 (415) 555-0378",
                raw_description="Three vehicles collided at intersection during traffic light outage. One driver dazed, small puddle of gasoline spreading near storm drain.",
                location_address="Intersection of Market St & 8th St",
                coordinates=Coordinates(lat=37.7788, lng=-122.4150),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P3,
                category=IncidentCategory.TRAFFIC_COLLISION,
                triage=AITriageResult(
                    severity_score=52,
                    priority=PriorityLevel.P3,
                    category=IncidentCategory.TRAFFIC_COLLISION,
                    estimated_victims=1,
                    detected_hazards=["Roadway Obstruction", "Minor Flammable Fuel Runoff"],
                    standard_operating_procedures=[
                        "Block inbound traffic lanes to protect incident scene",
                        "Apply absorbent sand to fuel puddle",
                        "Triage drivers for cervical spine trauma and shock"
                    ],
                    recommended_units=["PATROL-501 (Rapid Response)", "MEDIC-101"],
                    reasoning_summary="Moderate collision with localized traffic blockage and minor fuel hazard. Controlled conditions.",
                    evacuation_radius_meters=100,
                    confidence_score=0.90
                ),
                assigned_unit_ids=[],
                created_at=now_iso,
                updated_at=now_iso
            )
        ]
        for inc in initial_incidents:
            self.incidents[inc.id] = inc

        # Update initial assigned unit status
        self.units["unit-rescue-401"].status = UnitStatus.DISPATCHED
        self.units["unit-rescue-401"].assigned_incident_id = "inc-911-002"
        self.units["unit-rescue-401"].eta_minutes = 4.2
        self.units["unit-rescue-401"].speed_kmh = 48.0

        # 4. Seed Major Metropolitan Hospitals
        initial_hospitals = [
            Hospital(
                id="hosp-01",
                name="Zuckerberg Metro General & Trauma Center",
                address="1001 Potrero Ave, Mission District",
                coordinates=Coordinates(lat=37.7558, lng=-122.4045),
                trauma_level="Level 1 Trauma Center",
                total_beds=450,
                available_beds=24,
                icu_capacity=8,
                phone="+1 (415) 206-8000",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Trauma Bay 1 (Sterile)",
                er_preparedness_notes=[
                    "Level-1 Emergency Surgical Team on standby",
                    "Rapid Blood Infuser pre-primed with O-Negative",
                    "Dedicated CT Scanner cleared for immediate polytrauma scan"
                ]
            ),
            Hospital(
                id="hosp-02",
                name="UCSF Mission Bay Medical Complex",
                address="1825 4th St, Mission Bay",
                coordinates=Coordinates(lat=37.7680, lng=-122.3915),
                trauma_level="Level 1 Comprehensive & Pediatric",
                total_beds=320,
                available_beds=38,
                icu_capacity=14,
                phone="+1 (415) 353-1000",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Pediatric/Adult Bay 3",
                er_preparedness_notes=[
                    "Pediatric Intensive Care & Burn Care Unit active",
                    "Neurotrauma surgeon on direct audio link"
                ]
            ),
            Hospital(
                id="hosp-03",
                name="St. Francis Memorial Emergency Pavilion",
                address="900 Hyde St, Nob Hill",
                coordinates=Coordinates(lat=37.7905, lng=-122.4150),
                trauma_level="Level 2 Emergency Trauma",
                total_beds=210,
                available_beds=19,
                icu_capacity=5,
                phone="+1 (415) 353-6000",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Acute Bay 2",
                er_preparedness_notes=[
                    "Comprehensive Burn Center with hyperbaric stabilization chamber"
                ]
            ),
            Hospital(
                id="hosp-04",
                name="Kaiser Permanente Central Emergency",
                address="2425 Geary Blvd, Western Addition",
                coordinates=Coordinates(lat=37.7825, lng=-122.4410),
                trauma_level="Level 2 Comprehensive Emergency",
                total_beds=280,
                available_beds=31,
                icu_capacity=9,
                phone="+1 (415) 833-2000",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="ER Resuscitation Room A",
                er_preparedness_notes=[
                    "Rapid Cardiac Catheterization lab on 24/7 activation"
                ]
            )
        ]
        for h in initial_hospitals:
            self.hospitals[h.id] = h

        # 5. Seed Smart Traffic Signals across Major Arterials
        initial_signals = [
            TrafficSignal(
                id="sig-01",
                intersection_name="Market St & 4th St Crossing",
                coordinates=Coordinates(lat=37.7855, lng=-122.4055),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-02",
                intersection_name="Market St & 8th St Transit Cross",
                coordinates=Coordinates(lat=37.7788, lng=-122.4150),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-03",
                intersection_name="Mission St & 16th St Arterial",
                coordinates=Coordinates(lat=37.7650, lng=-122.4198),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-04",
                intersection_name="Potrero Ave & 22nd St Hospital Gate",
                coordinates=Coordinates(lat=37.7580, lng=-122.4060),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-05",
                intersection_name="3rd St & Mariposa Waterfront Expressway",
                coordinates=Coordinates(lat=37.7640, lng=-122.3890),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-06",
                intersection_name="Van Ness Ave & Geary Blvd Highway Node",
                coordinates=Coordinates(lat=37.7850, lng=-122.4215),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            )
        ]
        for s in initial_signals:
            self.traffic_signals[s.id] = s

db = Database()
