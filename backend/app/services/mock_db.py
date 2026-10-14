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
        # 1. Seed Indian Responder Units (108 Ambulances, Karnataka Fire 101, Traffic Police 100)
        initial_units = [
            ResponderUnit(
                id="unit-ems-101",
                callsign="108-ALS-AMBULANCE (Pilot Rajesh)",
                type=UnitType.AMBULANCE_PARAMEDIC,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9380, lng=77.6210),
                speed_kmh=0.0,
                battery_or_fuel_pct=95,
                personnel_count=2
            ),
            ResponderUnit(
                id="unit-ems-104",
                callsign="108-TRAUMA-CRITICAL (Pilot Suresh)",
                type=UnitType.AMBULANCE_PARAMEDIC,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9250, lng=77.6180),
                speed_kmh=0.0,
                battery_or_fuel_pct=92,
                personnel_count=3
            ),
            ResponderUnit(
                id="unit-fire-201",
                callsign="FIRE-101-LADDER (Karnataka Fire)",
                type=UnitType.FIRE_ENGINE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9660, lng=77.5850),
                speed_kmh=0.0,
                battery_or_fuel_pct=91,
                personnel_count=4
            ),
            ResponderUnit(
                id="unit-fire-205",
                callsign="SDRF-HAZMAT-101 (State Disaster Response)",
                type=UnitType.FIRE_ENGINE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9420, lng=77.6880),
                speed_kmh=0.0,
                battery_or_fuel_pct=96,
                personnel_count=4
            ),
            ResponderUnit(
                id="unit-drone-301",
                callsign="GARUDA-ALPHA-RECON (ISRO SkyScan)",
                type=UnitType.DRONE_AERIAL_RECON,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9760, lng=77.5930),
                speed_kmh=0.0,
                battery_or_fuel_pct=99,
                personnel_count=1
            ),
            ResponderUnit(
                id="unit-drone-302",
                callsign="GARUDA-BRAVO-THERMAL (Night Recon)",
                type=UnitType.DRONE_AERIAL_RECON,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9190, lng=77.6280),
                speed_kmh=0.0,
                battery_or_fuel_pct=88,
                personnel_count=1
            ),
            ResponderUnit(
                id="unit-rescue-401",
                callsign="NDRF-HEAVY-RESCUE-801 (Urban Search)",
                type=UnitType.HEAVY_RESCUE,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9520, lng=77.6530),
                speed_kmh=0.0,
                battery_or_fuel_pct=85,
                personnel_count=5
            ),
            ResponderUnit(
                id="unit-tac-501",
                callsign="TRAFFIC-POLICE-100 (BTP Flying Squad)",
                type=UnitType.POLICE_TACTICAL,
                status=UnitStatus.IDLE,
                location=Coordinates(lat=12.9710, lng=77.6040),
                speed_kmh=0.0,
                battery_or_fuel_pct=90,
                personnel_count=2
            ),
        ]
        for u in initial_units:
            self.units[u.id] = u

        # 2. Seed Indian Smart City IoT Sensors (Bengaluru Urban Sensor Grid)
        now_iso = datetime.now(timezone.utc).isoformat()
        initial_sensors = [
            IoTSensor(
                id="sensor-f-01",
                name="Bellandur Lake Spillway Water Gauge",
                type=SensorType.FLOOD_DEPTH,
                location=Coordinates(lat=12.9370, lng=77.6740),
                value=2.4,
                unit="meters",
                threshold=2.0,
                status=SensorAlertStatus.CRITICAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-f-02",
                name="Silk Board Storm Drain Sump Level",
                type=SensorType.FLOOD_DEPTH,
                location=Coordinates(lat=12.9160, lng=77.6250),
                value=0.7,
                unit="meters",
                threshold=1.5,
                status=SensorAlertStatus.NORMAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-aq-01",
                name="Peenya Industrial Corridor Air Sentinel",
                type=SensorType.AIR_QUALITY_AQI,
                location=Coordinates(lat=13.0280, lng=77.5320),
                value=176.0,
                unit="AQI (Unhealthy)",
                threshold=100.0,
                status=SensorAlertStatus.WARNING,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-th-01",
                name="Whitefield Substation Thermal Sentinel",
                type=SensorType.THERMAL_HEAT,
                location=Coordinates(lat=12.9720, lng=77.7150),
                value=71.5,
                unit="°C",
                threshold=60.0,
                status=SensorAlertStatus.CRITICAL,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-tr-01",
                name="Outer Ring Road Marathahalli Arterial Congestion",
                type=SensorType.TRAFFIC_CONGESTION,
                location=Coordinates(lat=12.9580, lng=77.6980),
                value=92.0,
                unit="% Congestion",
                threshold=75.0,
                status=SensorAlertStatus.WARNING,
                last_updated=now_iso
            ),
            IoTSensor(
                id="sensor-se-01",
                name="MG Road Metro Seismic Tremor Station",
                type=SensorType.SEISMIC_TREMOR,
                location=Coordinates(lat=12.9750, lng=77.6080),
                value=1.5,
                unit="Richter (Micro)",
                threshold=3.5,
                status=SensorAlertStatus.NORMAL,
                last_updated=now_iso
            ),
        ]
        for s in initial_sensors:
            self.sensors[s.id] = s

        # 3. Seed Realistic Indian Emergency Incidents
        initial_incidents = [
            Incident(
                id="inc-112-001",
                title="Outer Ring Road Silk Board Chemical Tanker Blaze",
                caller_name="Inspector Ramesh Kumar (Bengaluru Traffic Police)",
                caller_phone="+91 98450 11201",
                raw_description="Solvent chemical tanker overturned and caught fire on Silk Board flyover ramp. Heavy toxic plume drifting toward residential apartments. Two drivers trapped, electrical line down.",
                location_address="Silk Board Central Flyover Ramp, Hosur Rd & ORR",
                coordinates=Coordinates(lat=12.9180, lng=77.6240),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P1,
                category=IncidentCategory.HAZMAT_SPILL,
                triage=AITriageResult(
                    severity_score=95,
                    priority=PriorityLevel.P1,
                    category=IncidentCategory.HAZMAT_SPILL,
                    estimated_victims=2,
                    detected_hazards=["Industrial Solvent Combustion", "Flyover Structural Stress", "Toxic Downwind Vapor"],
                    standard_operating_procedures=[
                        "Establish 600m perimeter around Silk Board Flyover",
                        "Deploy SDRF HAZMAT foam foam tender immediately",
                        "Launch ISRO SkyScan drone for aerial thermal mapping",
                        "Broadcast urgent shelter-in-place advisory across Koramangala & BTM"
                    ],
                    recommended_units=["SDRF-HAZMAT-101", "FIRE-101-LADDER", "GARUDA-ALPHA-RECON", "108-TRAUMA-CRITICAL"],
                    reasoning_summary="High-risk chemical blaze at critical urban highway interchange with trapped personnel and intense toxic smoke.",
                    evacuation_radius_meters=600,
                    confidence_score=0.98
                ),
                assigned_unit_ids=[],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-112-002",
                title="Bellandur Tech Corridor Underpass Monsoon Water Inundation",
                caller_name="Pooja Hegde (IT Park Operations)",
                caller_phone="+91 98801 11202",
                raw_description="Rapid water accumulation in Outer Ring Road subterranean underpass exceeding 2.2 meters depth. BMTC bus and two cars submerged with occupants on bus roof.",
                location_address="Bellandur Outer Ring Road Subterranean Underpass",
                coordinates=Coordinates(lat=12.9360, lng=77.6730),
                status=IncidentStatus.DISPATCHED,
                priority=PriorityLevel.P1,
                category=IncidentCategory.FLOOD_WATER,
                triage=AITriageResult(
                    severity_score=89,
                    priority=PriorityLevel.P1,
                    category=IncidentCategory.FLOOD_WATER,
                    estimated_victims=6,
                    detected_hazards=["Submerged Electrical Cables", "Fast-Moving Sump Water", "Vehicle Inundation Risk"],
                    standard_operating_procedures=[
                        "Cut power to underpass pumping substation immediately",
                        "Deploy NDRF inflatable rescue boats and flood divers",
                        "Divert approaching traffic from Marathahalli flyover",
                        "Prepare triage area on north service road"
                    ],
                    recommended_units=["NDRF-HEAVY-RESCUE-801", "108-ALS-AMBULANCE", "GARUDA-BRAVO-THERMAL"],
                    reasoning_summary="Active life-safety hazard with rising monsoon water trapping multiple bus commuters in low underpass.",
                    evacuation_radius_meters=350,
                    confidence_score=0.96
                ),
                assigned_unit_ids=["unit-rescue-401"],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-112-003",
                title="Brigade Road High-Rise Metro Complex Elevator Stall & Cardiac Distress",
                caller_name="Building Operations Manager (Sanjay Verma)",
                caller_phone="+91 99000 11203",
                raw_description="Elevator Car stuck between 14th and 15th floors following power surge. Elderly passenger reporting acute angina and chest tightness.",
                location_address="Brigade Towers, 135 Brigade Rd, Central CBD",
                coordinates=Coordinates(lat=12.9730, lng=77.6080),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P2,
                category=IncidentCategory.MEDICAL_TRAUMA,
                triage=AITriageResult(
                    severity_score=78,
                    priority=PriorityLevel.P2,
                    category=IncidentCategory.MEDICAL_TRAUMA,
                    estimated_victims=1,
                    detected_hazards=["Confined Elevator Shaft", "Myocardial Infarction Escalation"],
                    standard_operating_procedures=[
                        "Dispatch 108 Advanced Life Support (ALS) paramedic crew",
                        "Coordinate elevator machine room override with BESCOM engineers",
                        "Carry portable ECG monitor, oxygen and extrication sling"
                    ],
                    recommended_units=["108-TRAUMA-CRITICAL", "TRAFFIC-POLICE-100"],
                    reasoning_summary="Critical medical emergency complicated by mechanical entrapment at height. Rapid technical extrication required.",
                    evacuation_radius_meters=50,
                    confidence_score=0.93
                ),
                assigned_unit_ids=[],
                created_at=now_iso,
                updated_at=now_iso
            ),
            Incident(
                id="inc-112-004",
                title="HAL Old Airport Road Multi-Vehicle Collision & Fuel Leakage",
                caller_name="Eyewitness Motorist",
                caller_phone="+91 98440 11204",
                raw_description="Two cars collided with auto-rickshaw during peak traffic. Auto overturned, driver dazed with bleeding scalp, small fuel spill on road.",
                location_address="HAL Old Airport Road near Domlur Flyover",
                coordinates=Coordinates(lat=12.9610, lng=77.6430),
                status=IncidentStatus.REPORTED,
                priority=PriorityLevel.P3,
                category=IncidentCategory.TRAFFIC_COLLISION,
                triage=AITriageResult(
                    severity_score=54,
                    priority=PriorityLevel.P3,
                    category=IncidentCategory.TRAFFIC_COLLISION,
                    estimated_victims=2,
                    detected_hazards=["Roadway Obstruction", "Flammable Petrol Runoff"],
                    standard_operating_procedures=[
                        "Block inbound traffic lane to shield accident scene",
                        "Apply absorbent sand to petrol leak",
                        "Triage auto driver for head trauma and stabilize cervical spine"
                    ],
                    recommended_units=["TRAFFIC-POLICE-100", "108-ALS-AMBULANCE"],
                    reasoning_summary="Moderate collision causing localized arterial congestion and minor fuel hazard. Under control.",
                    evacuation_radius_meters=100,
                    confidence_score=0.91
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
        self.units["unit-rescue-401"].assigned_incident_id = "inc-112-002"
        self.units["unit-rescue-401"].eta_minutes = 4.2
        self.units["unit-rescue-401"].speed_kmh = 48.0

        # 4. Seed Major Indian Metropolitan Hospitals (Bengaluru Trauma Centers)
        initial_hospitals = [
            Hospital(
                id="hosp-01",
                name="Apollo Multi-Speciality Trauma & Emergency Center",
                address="Bannerghatta Rd, Opp IIMB, Bengaluru",
                coordinates=Coordinates(lat=12.9150, lng=77.5990),
                trauma_level="Level 1 Multi-Speciality Trauma",
                total_beds=550,
                available_beds=32,
                icu_capacity=18,
                phone="+91 (80) 2630-4050",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Trauma Bay 1 (Sterile & Cleared)",
                er_preparedness_notes=[
                    "Level-1 Emergency Surgical Team on standby",
                    "Rapid Blood Infuser primed with O-Negative",
                    "Direct cardiac cath-lab & CT bay cleared for immediate polytrauma"
                ]
            ),
            Hospital(
                id="hosp-02",
                name="Manipal Comprehensive Hospital & Organ Transplant Center",
                address="98 HAL Old Airport Road, Kodihalli",
                coordinates=Coordinates(lat=12.9590, lng=77.6480),
                trauma_level="Level 1 Comprehensive & Neuro-Trauma",
                total_beds=450,
                available_beds=40,
                icu_capacity=22,
                phone="+91 (80) 2502-4444",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Neuro-Trauma Resuscitation Bay 2",
                er_preparedness_notes=[
                    "Pediatric & Adult Intensive Care Trauma units fully operational",
                    "Senior Neurosurgeon and Anaesthetist on direct audio link"
                ]
            ),
            Hospital(
                id="hosp-03",
                name="Victoria Government Hospital & Emergency Trauma Pavilion",
                address="Bengaluru Medical College Campus, Fort",
                coordinates=Coordinates(lat=12.9630, lng=77.5740),
                trauma_level="Level 1 State Emergency & Burns Center",
                total_beds=600,
                available_beds=45,
                icu_capacity=28,
                phone="+91 (80) 2670-1150",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Acute Emergency Bay 3",
                er_preparedness_notes=[
                    "Dedicated High-Dependency Burns Unit & Hyperbaric oxygenation ready"
                ]
            ),
            Hospital(
                id="hosp-04",
                name="Fortis Escorts Super-Speciality Hospital",
                address="14 Cunningham Rd / Richmond Road, Bengaluru",
                coordinates=Coordinates(lat=12.9860, lng=77.5980),
                trauma_level="Level 2 Super-Speciality Trauma",
                total_beds=300,
                available_beds=26,
                icu_capacity=14,
                phone="+91 (80) 6621-4444",
                trauma_team_status="STANDBY",
                assigned_trauma_bay="Cardiac Trauma Suite A",
                er_preparedness_notes=[
                    "24/7 Primary Angioplasty & Emergency Resuscitation Suite ready"
                ]
            )
        ]
        for h in initial_hospitals:
            self.hospitals[h.id] = h

        # 5. Seed Smart Traffic Signals across Major Indian Arterial Corridors
        initial_signals = [
            TrafficSignal(
                id="sig-01",
                intersection_name="Silk Board Central Flyover Junction (Hosur Rd / ORR)",
                coordinates=Coordinates(lat=12.9175, lng=77.6235),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-02",
                intersection_name="Koramangala 100ft Rd & St. John's Hospital Crossing",
                coordinates=Coordinates(lat=12.9240, lng=77.6220),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-03",
                intersection_name="Koramangala Sony World Signal (100ft Rd & 80ft Rd)",
                coordinates=Coordinates(lat=12.9350, lng=77.6240),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-04",
                intersection_name="MG Road - Brigade Road Metro Interchange",
                coordinates=Coordinates(lat=12.9740, lng=77.6070),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-05",
                intersection_name="Indiranagar 100ft Road & CMH Road Junction",
                coordinates=Coordinates(lat=12.9785, lng=77.6410),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-06",
                intersection_name="Marathahalli Bridge Outer Ring Road Flyover Node",
                coordinates=Coordinates(lat=12.9560, lng=77.7010),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            ),
            TrafficSignal(
                id="sig-07",
                intersection_name="Hebbal Flyover Expressway Junction (NH-44)",
                coordinates=Coordinates(lat=13.0350, lng=77.5910),
                state=TrafficSignalState.RED,
                is_overridden=False,
                last_state_change=now_iso
            )
        ]
        for s in initial_signals:
            self.traffic_signals[s.id] = s

db = Database()
