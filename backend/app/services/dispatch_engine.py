import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import (
    ResponderUnit, Incident, IncidentStatus, UnitStatus, PriorityLevel, UnitType, SensorType,
    SensorAlertStatus, TrafficSignal, TrafficSignalState, GreenCorridorTransitSession,
    Coordinates, Hospital
)
from app.services.mock_db import db

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

class DispatchEngine:
    calculate_haversine_distance = staticmethod(calculate_haversine_distance)

    def get_traffic_congestion_factor(self, lat: float, lng: float) -> float:
        """Inspects nearby IoT traffic sensors to estimate urban speed dampening."""
        base_factor = 1.0
        for sensor in db.sensors.values():
            if sensor.type == SensorType.TRAFFIC_CONGESTION and sensor.status != SensorAlertStatus.NORMAL:
                dist = calculate_haversine_distance(lat, lng, sensor.location.lat, sensor.location.lng)
                if dist < 2.5:
                    # Near a congested corridor: adds 25% - 50% travel delay
                    base_factor += (sensor.value / 200.0)
        return min(base_factor, 1.8)

    def calculate_unit_eta(self, unit: ResponderUnit, incident_lat: float, incident_lng: float) -> float:
        """Computes realistic ETA in minutes based on distance, unit capabilities, and road traffic."""
        dist_km = calculate_haversine_distance(
            unit.location.lat, unit.location.lng,
            incident_lat, incident_lng
        )
        # Average metropolitan emergency response speeds
        if unit.type == UnitType.DRONE_AERIAL_RECON:
            nominal_speed = 75.0 # Drone flies direct line, unaffected by road gridlock
            traffic_penalty = 1.0
        elif unit.type in [UnitType.FIRE_ENGINE, UnitType.HEAVY_RESCUE]:
            nominal_speed = 40.0
            traffic_penalty = self.get_traffic_congestion_factor(incident_lat, incident_lng)
        else: # Paramedics and tactical patrol
            nominal_speed = 50.0
            traffic_penalty = self.get_traffic_congestion_factor(incident_lat, incident_lng)

        effective_speed = nominal_speed / traffic_penalty
        travel_time_hours = dist_km / max(effective_speed, 10.0)
        minutes = travel_time_hours * 60.0
        
        # Add quick dispatch staging latency (30 to 60 seconds)
        return round(minutes + 0.8, 1)

    def recommend_dispatch(self, incident: Incident) -> List[Dict[str, Any]]:
        """
        Synthesizes closest available units, capability alignment with AI Triage SOP,
        and computes ranked dispatch recommendations.
        """
        recommendations = []
        needed_types = []
        if incident.triage and incident.triage.recommended_units:
            needed_types = incident.triage.recommended_units

        for unit in db.units.values():
            # Skip units that are already on scene or offline
            if unit.status in [UnitStatus.ON_SCENE, UnitStatus.OFFLINE]:
                continue

            dist_km = calculate_haversine_distance(
                unit.location.lat, unit.location.lng,
                incident.coordinates.lat, incident.coordinates.lng
            )
            eta = self.calculate_unit_eta(unit, incident.coordinates.lat, incident.coordinates.lng)

            # Fit scoring: 100 base, penalized by distance and status
            fit_score = 100.0 - (dist_km * 7.5) - (eta * 3.0)
            
            # Capability bonus
            is_recommended_type = any(
                req.lower() in unit.type.value.lower() or unit.type.value.lower() in req.lower()
                for req in needed_types
            )
            if is_recommended_type:
                fit_score += 25.0
            
            # Idle bonus vs already dispatched
            if unit.status == UnitStatus.IDLE:
                fit_score += 15.0
            elif unit.status == UnitStatus.DISPATCHED:
                fit_score -= 20.0

            fit_score = max(min(round(fit_score, 1), 99.0), 20.0)

            rationale = (
                f"Proximity: {dist_km} km. ETA: ~{eta} min. "
                f"{'Specialized capability match for ' + unit.type.value if is_recommended_type else 'General responder support'}."
            )

            recommendations.append({
                "unit_id": unit.id,
                "callsign": unit.callsign,
                "type": unit.type.value,
                "current_status": unit.status.value,
                "distance_km": dist_km,
                "estimated_eta_minutes": eta,
                "fit_score": fit_score,
                "battery_or_fuel_pct": unit.battery_or_fuel_pct,
                "personnel_count": unit.personnel_count,
                "rationale": rationale
            })

        # Rank by highest fit score
        recommendations.sort(key=lambda x: x["fit_score"], reverse=True)
        return recommendations

    def execute_dispatch(self, incident_id: str, unit_ids: List[str]) -> Dict[str, Any]:
        """Dispatches specified units to the incident."""
        incident = db.incidents.get(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        dispatched_units = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for uid in unit_ids:
            unit = db.units.get(uid)
            if not unit:
                continue

            eta = self.calculate_unit_eta(unit, incident.coordinates.lat, incident.coordinates.lng)
            unit.status = UnitStatus.EN_ROUTE
            unit.assigned_incident_id = incident.id
            unit.eta_minutes = eta
            unit.speed_kmh = 54.0
            
            if uid not in incident.assigned_unit_ids:
                incident.assigned_unit_ids.append(uid)
            dispatched_units.append(unit)

        # Update incident status
        incident.status = IncidentStatus.DISPATCHED
        incident.updated_at = now_iso

        return {
            "incident_id": incident.id,
            "status": incident.status.value,
            "dispatched_units": [u.model_dump() for u in dispatched_units],
            "timestamp": now_iso
        }

    def find_nearest_available_ambulance(self, lat: float, lng: float) -> Optional[ResponderUnit]:
        """Identifies closest available paramedic ambulance on duty."""
        candidates = [
            u for u in db.units.values()
            if u.type == UnitType.AMBULANCE_PARAMEDIC and u.status == UnitStatus.IDLE
        ]
        if not candidates:
            # Fallback to any idle rescue unit if all ambulances are busy
            candidates = [u for u in db.units.values() if u.status == UnitStatus.IDLE]
            if not candidates:
                # If all units busy, pick the one with earliest ETA
                candidates = list(db.units.values())

        if not candidates:
            return None

        # Sort by distance to coordinates
        candidates.sort(
            key=lambda u: calculate_haversine_distance(u.location.lat, u.location.lng, lat, lng)
        )
        return candidates[0]

    def activate_green_corridor(
        self,
        ambulance_id: str,
        destination_hospital_id: str,
        pickup_address: str,
        pickup_coordinates: Coordinates,
        patient_condition: str = "Severe Trauma"
    ) -> GreenCorridorTransitSession:
        """
        Calculates corridor to target hospital, pre-empts traffic signals within 1 km (turning GREEN),
        alerts receiving ER trauma team, and sends route clearance alerts.
        """
        ambulance = db.units.get(ambulance_id)
        if not ambulance:
            raise ValueError(f"Ambulance {ambulance_id} not found")

        hospital = db.hospitals.get(destination_hospital_id)
        if not hospital:
            raise ValueError(f"Hospital {destination_hospital_id} not found")

        now_iso = datetime.now(timezone.utc).isoformat()
        session_id = f"corridor-{ambulance_id}-{int(datetime.now().timestamp())}"

        # Calculate ETA to hospital
        dist_to_hospital = calculate_haversine_distance(
            pickup_coordinates.lat, pickup_coordinates.lng,
            hospital.coordinates.lat, hospital.coordinates.lng
        )
        eta_minutes = round(max((dist_to_hospital / 60.0) * 60.0, 2.5), 1)

        # Update Ambulance
        ambulance.status = UnitStatus.EN_ROUTE
        ambulance.speed_kmh = 68.0
        ambulance.eta_minutes = eta_minutes

        # Prepare Hospital ER
        hospital.trauma_team_status = "ACTIVATED_PREPARING_BAY"
        hospital.assigned_trauma_bay = "Trauma Bay 1 (Sterile & Cleared)"
        hospital.er_preparedness_notes = [
            f"Pre-arrival alert from {ambulance.callsign}",
            f"Patient Condition: {patient_condition}",
            f"Estimated Arrival in {eta_minutes} minutes",
            "Emergency Surgeon & Anesthesiologist notified at trauma bay"
        ]

        # Scan all traffic signals along route and pre-empt those within 1.0 km
        corridor_signals = []
        signals_cleared = 0
        for sig in db.traffic_signals.values():
            dist_to_amb = calculate_haversine_distance(
                pickup_coordinates.lat, pickup_coordinates.lng,
                sig.coordinates.lat, sig.coordinates.lng
            )
            sig.distance_to_active_ambulance_km = dist_to_amb

            # Rule: If within 1.0 km, automatically switch to EMERGENCY_OVERRIDE (GREEN)
            if dist_to_amb <= 1.2:
                sig.state = TrafficSignalState.EMERGENCY_OVERRIDE
                sig.is_overridden = True
                sig.cleared_for_ambulance_id = ambulance.id
                sig.last_state_change = now_iso
                signals_cleared += 1
            else:
                sig.state = TrafficSignalState.RED
                sig.is_overridden = False

            corridor_signals.append(sig)

        waypoints = [
            pickup_coordinates,
            Coordinates(lat=(pickup_coordinates.lat + hospital.coordinates.lat) / 2,
                        lng=(pickup_coordinates.lng + hospital.coordinates.lng) / 2),
            hospital.coordinates
        ]

        session = GreenCorridorTransitSession(
            id=session_id,
            ambulance_id=ambulance.id,
            ambulance_callsign=ambulance.callsign,
            destination_hospital_id=hospital.id,
            hospital_name=hospital.name,
            pickup_address=pickup_address,
            status="ACTIVE_EN_ROUTE",
            active_signals_cleared=signals_cleared,
            total_signals_in_corridor=len(corridor_signals),
            eta_minutes=eta_minutes,
            route_clearance_broadcast_sent=True,
            er_preparedness_status="TRAUMA_BAY_READY_SURGEONS_STANDBY",
            corridor_waypoints=waypoints,
            signals=corridor_signals,
            start_time=now_iso,
            last_updated=now_iso
        )

        db.active_corridors[ambulance_id] = session
        return session

dispatch_engine = DispatchEngine()
