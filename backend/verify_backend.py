import json
from starlette.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print("1. [PASS] Health Check:", data["status"], "- System:", data["system"])

        # 2. Incidents list
        res = client.get("/api/v1/incidents")
        assert res.status_code == 200, f"Incidents failed: {res.text}"
        incidents = res.json()
        print(f"2. [PASS] Incidents list: Retrieved {len(incidents)} pre-seeded incidents.")
        assert len(incidents) >= 4, "Expected initial pre-seeded incidents"

        # 3. Units list
        res = client.get("/api/v1/units")
        assert res.status_code == 200, f"Units failed: {res.text}"
        units = res.json()
        print(f"3. [PASS] Responder fleet: Retrieved {len(units)} first-responder units.")
        assert len(units) >= 5, "Expected initial units"

        # 4. Sensors list
        res = client.get("/api/v1/sensors")
        assert res.status_code == 200, f"Sensors failed: {res.text}"
        sensors = res.json()
        print(f"4. [PASS] IoT Sensors: Retrieved {len(sensors)} smart city sensors.")
        assert len(sensors) >= 5, "Expected initial sensors"

        # 5. Hospitals list
        res = client.get("/api/v1/hospitals")
        assert res.status_code == 200, f"Hospitals failed: {res.text}"
        hospitals = res.json()
        print(f"5. [PASS] Metropolitan Hospitals: Retrieved {len(hospitals)} trauma centers (e.g. {hospitals[0]['name']}).")
        assert len(hospitals) >= 4, "Expected initial hospitals"

        # 6. Smart Traffic Signals list
        res = client.get("/api/v1/traffic-signals")
        assert res.status_code == 200, f"Traffic signals failed: {res.text}"
        signals = res.json()
        print(f"6. [PASS] Smart Traffic Signals: Retrieved {len(signals)} intersection nodes.")
        assert len(signals) >= 5, "Expected initial traffic signals"

        # 7. Citizen Snap SOS Accident with Auto-Scramble
        snap_payload = {
            "image_base64": "data:image/jpeg;base64,roadway_crash_simulated_bytes",
            "location_address": "Silk Board Central Flyover Junction, Hosur Rd & ORR",
            "coordinates": {"lat": 12.9180, "lng": 77.6240},
            "reporter_name": "Eyewitness Bystander (Vikram Sharma)",
            "optional_notes": "Two vehicles collided violently on flyover ramp. One driver pinned, radiator smoking."
        }
        res = client.post("/api/v1/citizen-snap-sos", json=snap_payload)
        assert res.status_code == 200, f"Snap SOS failed: {res.text}"
        scramble = res.json()
        print(f"7. [PASS] Citizen Photo Snap: Accident ingested, auto-scrambled {scramble['assigned_ambulance_callsign']} (ETA: {scramble['eta_minutes']} min, Distance: {scramble['distance_km']} km).")

        # 8. Start Green Corridor Transit & < 1 km Signal Preemption
        amb_id = scramble["assigned_ambulance_id"]
        hosp_id = hospitals[0]["id"]
        corridor_payload = {
            "ambulance_id": amb_id,
            "destination_hospital_id": hosp_id,
            "pickup_address": "Silk Board Central Flyover Junction, Hosur Rd & ORR",
            "pickup_coordinates": {"lat": 12.9180, "lng": 77.6240},
            "patient_condition": "Severe Traumatic Brain Injury"
        }
        res = client.post("/api/v1/ambulance/transit/start", json=corridor_payload)
        assert res.status_code == 200, f"Green corridor failed: {res.text}"
        session = res.json()
        print(f"8. [PASS] Green Corridor AI: Transit started for {session['ambulance_callsign']} to {session['hospital_name']}. Preempted {session['active_signals_cleared']} signals to 100% GREEN.")
        assert session["route_clearance_broadcast_sent"] is True

        # 9. Verify Hospital ER alert was received
        res = client.get("/api/v1/hospitals")
        updated_hosps = res.json()
        target_hosp = next(h for h in updated_hosps if h["id"] == hosp_id)
        assert target_hosp["trauma_team_status"] == "ACTIVATED_PREPARING_BAY"
        print(f"9. [PASS] Hospital ER Preparation: {target_hosp['name']} Trauma Bay activated and sterile.")

        # 10. Analytics Metrics
        res = client.get("/api/v1/analytics/metrics")
        assert res.status_code == 200, f"Analytics failed: {res.text}"
        metrics = res.json()
        print(f"10. [PASS] Urban Resilience Score: {metrics['overall_city_resilience_score']}/100")

        print("\n=========================================================================")
        print(">>> ALL 10 GREEN CORRIDOR & CITIZEN AUTO-SCRAMBLE VERIFICATION TESTS PASSED <<<")
        print("=========================================================================")

if __name__ == "__main__":
    run_tests()
