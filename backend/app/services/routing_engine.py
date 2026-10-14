import math
from typing import List, Dict, Tuple
from datetime import datetime, timezone

from app.models.schemas import (
    Coordinates, Hospital, HospitalRecommendation, HospitalRouteOption,
    HospitalRoutingResponse, RoadSegment, RoadCongestionLevel,
    GreenCorridorTransitSession, DriverRouteAcceptanceResponse, TrafficSignalState
)
from app.services.mock_db import db
from app.services.dispatch_engine import calculate_haversine_distance


class RoutingEngine:
    """
    Intelligent Emergency Route Computation & Multi-Hospital Path Optimization Engine.
    - Identifies the shortest-distance nearest hospital and top-tier trauma centers.
    - Generates 3 differentiated route options for the ambulance pilot:
      1. AI Green Corridor Express (Preempted Signals - Recommended)
      2. Traffic-Free Elevated Bypass / Ring Road (Unobstructed Free Flow)
      3. Shortest Distance Path (Direct mileage across surface streets)
    - Recommends the optimal route and provides interactive driver route acceptance.
    - Exposes live traffic conditions across metropolitan roadway networks.
    """

    def calculate_hospital_routes(
        self,
        pickup_address: str,
        pickup_coordinates: Coordinates,
        ambulance_id: str = None,
        patient_condition: str = "Severe Trauma"
    ) -> HospitalRoutingResponse:
        """
        Calculates distance, shortest path, and route options for all metropolitan hospitals.
        """
        hospital_recommendations: List[HospitalRecommendation] = []

        all_signals = list(db.traffic_signals.values())
        all_roads = list(db.road_segments.values())

        traffic_free_roads = [r for r in all_roads if r.is_traffic_free]
        congested_roads = [r for r in all_roads if not r.is_traffic_free]

        for hosp in db.hospitals.values():
            dist_km = calculate_haversine_distance(
                pickup_coordinates.lat, pickup_coordinates.lng,
                hosp.coordinates.lat, hosp.coordinates.lng
            )
            dist_km = round(max(dist_km, 0.8), 2)

            # Route A: AI Green Corridor Express (Signals Preempted)
            est_min_preempted = round(max((dist_km / 65.0) * 60.0, 2.2), 1)
            est_min_normal = round(max((dist_km / 24.0) * 60.0 + 4.0, 5.5), 1)
            time_saved = round(est_min_normal - est_min_preempted, 1)

            # Count signals within corridor proximity
            signals_in_corridor = [
                s for s in all_signals
                if calculate_haversine_distance(
                    (pickup_coordinates.lat + hosp.coordinates.lat) / 2,
                    (pickup_coordinates.lng + hosp.coordinates.lng) / 2,
                    s.coordinates.lat, s.coordinates.lng
                ) <= (dist_km * 0.75 + 1.0)
            ]
            signals_count = max(len(signals_in_corridor), 2)
            preempted_count = min(signals_count, 4)

            # Generate realistic route waypoints for Route A (Arterial preemption)
            mid_lat = (pickup_coordinates.lat + hosp.coordinates.lat) / 2
            mid_lng = (pickup_coordinates.lng + hosp.coordinates.lng) / 2
            
            # Subtle curvature to simulate real arterial boulevard
            route_a_waypoints = [
                pickup_coordinates,
                Coordinates(lat=round(pickup_coordinates.lat * 0.7 + hosp.coordinates.lat * 0.3, 5),
                            lng=round(pickup_coordinates.lng * 0.7 + hosp.coordinates.lng * 0.3 + 0.003, 5)),
                Coordinates(lat=round(mid_lat, 5), lng=round(mid_lng, 5)),
                Coordinates(lat=round(pickup_coordinates.lat * 0.3 + hosp.coordinates.lat * 0.7, 5),
                            lng=round(pickup_coordinates.lng * 0.3 + hosp.coordinates.lng * 0.7 - 0.002, 5)),
                hosp.coordinates
            ]

            route_a = HospitalRouteOption(
                route_id="route-green-corridor",
                route_name="Route A: AI Green Corridor Express (Signal Preemption)",
                route_type="AI_GREEN_CORRIDOR",
                is_recommended=True,
                distance_km=dist_km,
                estimated_minutes_normal=est_min_normal,
                estimated_minutes_preempted=est_min_preempted,
                time_saved_minutes=time_saved,
                congestion_score_pct=14,
                traffic_free_pct=86,
                signals_count=signals_count,
                signals_preempted_count=preempted_count,
                via_roads=[
                    "Outer Ring Road Express Corridor",
                    "Smart Intersection Overrides",
                    "Emergency Hospital Flyover Ingress"
                ],
                waypoints=route_a_waypoints,
                driver_pros=[
                    f"Fastest ETA ({est_min_preempted} min vs {est_min_normal} min)",
                    f"Automated 100% Green clearance on {preempted_count} approaching junctions",
                    "Direct telemetry synchronization with Trauma Bay 1 ER staff"
                ],
                driver_cons=[
                    "Requires maintaining authorized emergency speed profile",
                    "Requires active siren/beacon clearance protocol"
                ]
            )

            # Route B: Traffic-Free Elevated Bypass / Ring Road
            bypass_dist = round(dist_km * 1.25, 2)
            bypass_min = round(max((bypass_dist / 74.0) * 60.0, 3.0), 1)
            
            # Bypass waypoints sweeping around urban bottlenecks
            route_b_waypoints = [
                pickup_coordinates,
                Coordinates(lat=round(pickup_coordinates.lat + 0.006, 5),
                            lng=round(pickup_coordinates.lng + 0.009, 5)),
                Coordinates(lat=round(mid_lat + 0.010, 5),
                            lng=round(mid_lng + 0.012, 5)),
                Coordinates(lat=round(hosp.coordinates.lat + 0.004, 5),
                            lng=round(hosp.coordinates.lng + 0.007, 5)),
                hosp.coordinates
            ]

            route_b = HospitalRouteOption(
                route_id="route-traffic-free-bypass",
                route_name="Route B: Traffic-Free Elevated Bypass & Expressway",
                route_type="TRAFFIC_FREE_BYPASS",
                is_recommended=False,
                distance_km=bypass_dist,
                estimated_minutes_normal=round(bypass_min + 1.5, 1),
                estimated_minutes_preempted=bypass_min,
                time_saved_minutes=round(est_min_normal - bypass_min, 1),
                congestion_score_pct=4,
                traffic_free_pct=96,
                signals_count=1,
                signals_preempted_count=1,
                via_roads=[
                    "Hosur Rd & Electronics City Elevated Expressway (NH-44)",
                    "NICE Ring Road Elevated Bypass",
                    "Grade-Separated Hospital Ramp"
                ],
                waypoints=route_b_waypoints,
                driver_pros=[
                    "96% Traffic-Free free-flowing elevated grade",
                    "Completely avoids ground-level bottleneck congestion",
                    "Zero stop-and-go braking: optimum for spinal trauma stability"
                ],
                driver_cons=[
                    f"+{round(bypass_dist - dist_km, 1)} km longer physical distance",
                    "Toll gantry clearance required (transponder auto-whitelisted)"
                ]
            )

            # Route C: Shortest Distance Path (Direct Mileage Surface Streets)
            shortest_dist = round(dist_km * 0.95, 2)
            shortest_min_normal = round(max((shortest_dist / 18.0) * 60.0 + 3.0, 6.5), 1)
            
            # Direct straight line path
            route_c_waypoints = [
                pickup_coordinates,
                Coordinates(lat=round(mid_lat, 5), lng=round(mid_lng, 5)),
                hosp.coordinates
            ]

            route_c = HospitalRouteOption(
                route_id="route-shortest-dist",
                route_name="Route C: Shortest Distance Path (Direct Mileage)",
                route_type="SHORTEST_DISTANCE",
                is_recommended=False,
                distance_km=shortest_dist,
                estimated_minutes_normal=shortest_min_normal,
                estimated_minutes_preempted=round(shortest_min_normal * 0.75, 1),
                time_saved_minutes=0.0,
                congestion_score_pct=64,
                traffic_free_pct=36,
                signals_count=signals_count + 2,
                signals_preempted_count=0,
                via_roads=[
                    "Local Urban Cross-Streets",
                    "Commercial Surface Arterial",
                    "Hospital East Gate Road"
                ],
                waypoints=route_c_waypoints,
                driver_pros=[
                    f"Absolute shortest physical distance ({shortest_dist} km)",
                    "Direct route with minimal turning maneuvers"
                ],
                driver_cons=[
                    f"Slowest transit time (~{shortest_min_normal} minutes)",
                    "Heavy surface friction: 64% congestion delay risk",
                    "No automatic traffic signal preemption on local cross-streets"
                ]
            )

            # Score Hospital Suitability
            # Combines closeness (40%), bed availability (30%), ICU (20%), Trauma Bay readiness (10%)
            dist_score = max(0, 100 - (dist_km * 12))
            bed_score = min(100, (hosp.available_beds / 30.0) * 100)
            icu_score = min(100, (hosp.icu_capacity / 15.0) * 100)
            bay_ready = hosp.assigned_trauma_bay is not None or hosp.trauma_team_status in ["STANDBY", "ACTIVATED_PREPARING_BAY"]
            overall_score = round(dist_score * 0.40 + bed_score * 0.30 + icu_score * 0.20 + (10 if bay_ready else 0), 1)

            rec = HospitalRecommendation(
                hospital=hosp,
                distance_km=dist_km,
                shortest_travel_time_minutes=est_min_preempted,
                trauma_bay_ready=bay_ready,
                icu_available=hosp.icu_capacity,
                bed_availability_score=int(bed_score),
                overall_score=overall_score,
                is_nearest=False,  # Evaluated below
                is_recommended=False,  # Evaluated below
                route_options=[route_a, route_b, route_c]
            )
            hospital_recommendations.append(rec)

        # Sort to determine nearest and top-recommended
        hospital_recommendations.sort(key=lambda h: h.distance_km)
        if hospital_recommendations:
            hospital_recommendations[0].is_nearest = True

        # Sort by overall score (balancing nearest distance + ER readiness)
        scored_sorted = sorted(hospital_recommendations, key=lambda h: h.overall_score, reverse=True)
        recommended_hospital = scored_sorted[0] if scored_sorted else hospital_recommendations[0]
        recommended_hospital.is_recommended = True

        nearest_hospital = hospital_recommendations[0]

        return HospitalRoutingResponse(
            pickup_address=pickup_address,
            pickup_coordinates=pickup_coordinates,
            nearest_hospital=nearest_hospital,
            recommended_hospital=recommended_hospital,
            all_hospitals=hospital_recommendations,
            active_traffic_free_roads=traffic_free_roads,
            congested_roads=congested_roads
        )

    def driver_accept_route(
        self,
        ambulance_id: str,
        destination_hospital_id: str,
        chosen_route_id: str,
        pickup_address: str,
        pickup_coordinates: Coordinates,
        patient_condition: str = "Severe Trauma",
        driver_notes: str = ""
    ) -> DriverRouteAcceptanceResponse:
        """
        Processes driver route acceptance or route modification from ambulance in-cab terminal:
        - Updates or initiates the Green Corridor session with chosen waypoints & ETA.
        - Synchronizes destination hospital trauma bay and pre-empts traffic signals.
        """
        ambulance = db.units.get(ambulance_id)
        if not ambulance:
            ambulance = list(db.units.values())[0]

        hospital = db.hospitals.get(destination_hospital_id)
        if not hospital:
            hospital = list(db.hospitals.values())[0]

        routing_response = self.calculate_hospital_routes(
            pickup_address=pickup_address,
            pickup_coordinates=pickup_coordinates,
            ambulance_id=ambulance.id,
            patient_condition=patient_condition
        )

        # Find matching hospital candidate
        hosp_rec = next((h for h in routing_response.all_hospitals if h.hospital.id == hospital.id), routing_response.recommended_hospital)
        
        # Find matching route option
        chosen_route = next((r for r in hosp_rec.route_options if r.route_id == chosen_route_id), hosp_rec.route_options[0])

        now_iso = datetime.now(timezone.utc).isoformat()
        session_id = f"corridor-{ambulance.id}-{int(datetime.now().timestamp())}"

        # Pre-empt signals if Green Corridor or Bypass route selected
        signals_cleared = 0
        corridor_signals = []
        should_preempt = chosen_route.route_type in ["AI_GREEN_CORRIDOR", "TRAFFIC_FREE_BYPASS"]

        for sig in db.traffic_signals.values():
            dist_to_amb = calculate_haversine_distance(
                pickup_coordinates.lat, pickup_coordinates.lng,
                sig.coordinates.lat, sig.coordinates.lng
            )
            sig.distance_to_active_ambulance_km = dist_to_amb

            if should_preempt and dist_to_amb <= 1.5:
                sig.state = TrafficSignalState.EMERGENCY_OVERRIDE
                sig.is_overridden = True
                sig.cleared_for_ambulance_id = ambulance.id
                sig.last_state_change = now_iso
                signals_cleared += 1
            else:
                sig.state = TrafficSignalState.RED
                sig.is_overridden = False

            corridor_signals.append(sig)

        # Update Ambulance
        ambulance.status = "EN_ROUTE"
        ambulance.eta_minutes = chosen_route.estimated_minutes_preempted if should_preempt else chosen_route.estimated_minutes_normal
        ambulance.speed_kmh = 68.0 if should_preempt else 32.0

        # Update Hospital ER
        hospital.trauma_team_status = "ACTIVATED_PREPARING_BAY"
        hospital.assigned_trauma_bay = "Trauma Bay 1 (Sterile & Pre-Alerted)"
        hospital.er_preparedness_notes = [
            f"Ambulance {ambulance.callsign} en route via {chosen_route.route_name}",
            f"Driver Accepted Route: {chosen_route.route_id} ({chosen_route.distance_km} km)",
            f"ETA: {ambulance.eta_minutes} min | Patient: {patient_condition}",
            f"Driver In-Cab Notes: {driver_notes or 'Route accepted on terminal'}"
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
            eta_minutes=ambulance.eta_minutes,
            route_clearance_broadcast_sent=True,
            er_preparedness_status="TRAUMA_BAY_READY_SURGEONS_STANDBY",
            corridor_waypoints=chosen_route.waypoints,
            signals=corridor_signals,
            start_time=now_iso,
            last_updated=now_iso
        )
        db.active_corridors[ambulance.id] = session

        return DriverRouteAcceptanceResponse(
            success=True,
            message=f"Route successfully accepted by driver for {hospital.name}.",
            ambulance_id=ambulance.id,
            hospital_id=hospital.id,
            hospital_name=hospital.name,
            chosen_route_id=chosen_route.route_id,
            chosen_route_name=chosen_route.route_name,
            eta_minutes=ambulance.eta_minutes,
            distance_km=chosen_route.distance_km,
            signals_preempted=signals_cleared,
            session=session
        )


routing_engine = RoutingEngine()
