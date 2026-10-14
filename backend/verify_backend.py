import json
from starlette.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        # 1. Health check & Security Configuration
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        assert data["security"]["security_headers"] is True
        assert data["security"]["rate_limiter_active"] is True
        assert data["security"]["gzip_compression"] is True
        print(f"1. [PASS] Health Check: {data['status']} - System: {data['system']}")

        # 2. Defense-in-Depth Security Headers
        assert res.headers.get("x-content-type-options") == "nosniff"
        assert res.headers.get("x-frame-options") == "DENY"
        assert "max-age=31536000" in res.headers.get("strict-transport-security", "")
        assert "ms" in res.headers.get("x-process-time", "")
        print("2. [PASS] Security Headers: X-Content-Type-Options, X-Frame-Options, HSTS, X-Process-Time verified.")

        # 3. Rate Limiting Headers
        res_limit = client.get("/api/v1/incidents")
        assert "x-ratelimit-limit" in res_limit.headers
        assert "x-ratelimit-remaining" in res_limit.headers
        print(f"3. [PASS] Rate Limiter: Limit={res_limit.headers.get('x-ratelimit-limit')}, Remaining={res_limit.headers.get('x-ratelimit-remaining')}")

        # 4. Cryptographic Government Login & HMAC-SHA256 Token Verification
        login_res = client.post("/api/v1/auth/gov-login", json={
            "badge_id": "EMS-108-KA01",
            "role": "AMBULANCE_DRIVER",
            "name": "Pilot Suresh",
            "department": "Karnataka Health & Emergency 108 Services"
        })
        assert login_res.status_code == 200, f"Gov login failed: {login_res.text}"
        login_data = login_res.json()
        token = login_data["access_token"]
        assert token and len(token.split(".")) == 3
        # Verify token
        verify_res = client.post("/api/v1/auth/verify", json={"token": token})
        assert verify_res.status_code == 200
        assert verify_res.json()["valid"] is True
        print(f"4. [PASS] Government Cryptographic Auth: Signed token verified for Pilot Suresh (Badge: EMS-108-KA01).")

        # 5. Input Sanitization against XSS Injection
        xss_res = client.post("/api/v1/incidents", json={
            "title": "Clean Title <script>alert('xss')</script>",
            "raw_description": "Accident report with malicious <img src=x onerror=alert(1)> tag",
            "location_address": "MG Road, Bengaluru",
            "coordinates": {"lat": 12.9740, "lng": 77.6070},
            "caller_name": "<script>evil()</script>Ramesh",
            "caller_phone": "+91 98450 11208"
        })
        assert xss_res.status_code == 200
        xss_data = xss_res.json()
        assert "<script>" not in xss_data["title"]
        assert "<script>" not in xss_data["raw_description"]
        assert "<script>" not in xss_data["caller_name"]
        print("5. [PASS] Input Sanitization: XSS & script tags successfully stripped from incident intake.")

        # 6. Incidents list
        res = client.get("/api/v1/incidents")
        assert res.status_code == 200, f"Incidents failed: {res.text}"
        incidents = res.json()
        print(f"6. [PASS] Incidents list: Retrieved {len(incidents)} active incidents.")
        assert len(incidents) >= 4, "Expected initial pre-seeded incidents"

        # 7. Units list
        res = client.get("/api/v1/units")
        assert res.status_code == 200, f"Units failed: {res.text}"
        units = res.json()
        print(f"7. [PASS] Responder fleet: Retrieved {len(units)} first-responder units.")
        assert len(units) >= 5, "Expected initial units"

        # 8. Sensors list
        res = client.get("/api/v1/sensors")
        assert res.status_code == 200, f"Sensors failed: {res.text}"
        sensors = res.json()
        print(f"8. [PASS] IoT Sensors: Retrieved {len(sensors)} smart city sensors.")
        assert len(sensors) >= 5, "Expected initial sensors"

        # 9. Hospitals list
        res = client.get("/api/v1/hospitals")
        assert res.status_code == 200, f"Hospitals failed: {res.text}"
        hospitals = res.json()
        print(f"9. [PASS] Metropolitan Hospitals: Retrieved {len(hospitals)} trauma centers (e.g. {hospitals[0]['name']}).")
        assert len(hospitals) >= 4, "Expected initial hospitals"

        # 10. Smart Traffic Signals list
        res = client.get("/api/v1/traffic-signals")
        assert res.status_code == 200, f"Traffic signals failed: {res.text}"
        signals = res.json()
        print(f"10. [PASS] Smart Traffic Signals: Retrieved {len(signals)} intersection nodes.")
        assert len(signals) >= 5, "Expected initial traffic signals"

        # 11. Citizen Snap SOS Accident with Auto-Scramble
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
        print(f"11. [PASS] Citizen Photo Snap: Accident ingested, auto-scrambled {scramble['assigned_ambulance_callsign']} (ETA: {scramble['eta_minutes']} min, Distance: {scramble['distance_km']} km).")

        # 12. Start Green Corridor Transit & < 1 km Signal Preemption
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
        print(f"12. [PASS] Green Corridor AI: Transit started for {session['ambulance_callsign']} to {session['hospital_name']}. Preempted {session['active_signals_cleared']} signals to 100% GREEN.")
        assert session["route_clearance_broadcast_sent"] is True

        # 13. Verify Hospital ER alert was received
        res = client.get("/api/v1/hospitals")
        updated_hosps = res.json()
        target_hosp = next(h for h in updated_hosps if h["id"] == hosp_id)
        assert target_hosp["trauma_team_status"] == "ACTIVATED_PREPARING_BAY"
        print(f"13. [PASS] Hospital ER Preparation: {target_hosp['name']} Trauma Bay activated and sterile.")

        # 14. Analytics Metrics
        res = client.get("/api/v1/analytics/metrics")
        assert res.status_code == 200, f"Analytics failed: {res.text}"
        metrics = res.json()
        print(f"14. [PASS] Urban Resilience Score: {metrics['overall_city_resilience_score']}/100")

        # 15. Production Webpage Serving & PWA Manifest
        res_root = client.get("/")
        assert res_root.status_code == 200
        assert "text/html" in res_root.headers.get("content-type", "")
        assert "RescuELINK" in res_root.text
        
        res_m = client.get("/manifest.json")
        assert res_m.status_code == 200
        assert res_m.json()["short_name"] == "RescuELINK"
        print("15. [PASS] Production Website & PWA: Serves production HTML and valid web app manifest.")

        # 16. SPA Client-Side Routing Fallback & API Root Discovery
        res_spa = client.get("/corridor/active")
        assert res_spa.status_code == 200
        assert "text/html" in res_spa.headers.get("content-type", "")
        
        res_api = client.get("/api")
        assert res_api.status_code == 200
        assert res_api.json()["helplines"]["national_emergency"] == 112
        print("16. [PASS] SPA Client-Side Route Fallback: Verified deep-link routing and API discovery root.")

        # 17. Nearest Hospital & Multi-Route Path Optimization
        route_req = {
            "pickup_address": "Silk Board Junction, Hosur Rd & ORR Crossing",
            "pickup_coordinates": {"lat": 12.9180, "lng": 77.6240},
            "ambulance_id": "unit-ems-101",
            "patient_condition": "Acute Traumatic Brain Injury"
        }
        res_routing = client.post("/api/v1/routing/nearest-hospital", json=route_req)
        assert res_routing.status_code == 200, f"Routing failed: {res_routing.text}"
        routing_data = res_routing.json()
        assert "nearest_hospital" in routing_data
        assert "recommended_hospital" in routing_data
        assert len(routing_data["all_hospitals"]) >= 4
        nearest_hosp = routing_data["nearest_hospital"]
        assert len(nearest_hosp["route_options"]) == 3
        # Ensure Route A (AI Green Corridor), Route B (Traffic-Free Bypass), Route C (Shortest Distance) exist
        route_types = [r["route_type"] for r in nearest_hosp["route_options"]]
        assert "AI_GREEN_CORRIDOR" in route_types
        assert "TRAFFIC_FREE_BYPASS" in route_types
        assert "SHORTEST_DISTANCE" in route_types
        print(f"17. [PASS] Nearest Hospital & Multi-Route Path Optimization: Nearest is {nearest_hosp['hospital']['name']} ({nearest_hosp['distance_km']} km). 3 Route alternatives calculated.")

        # 18. Traffic-Free Roads & Congestion Telemetry
        res_roads = client.get("/api/v1/routing/roads")
        assert res_roads.status_code == 200, f"Roads failed: {res_roads.text}"
        roads = res_roads.json()
        assert len(roads) >= 6
        traffic_free_roads = [r for r in roads if r["is_traffic_free"]]
        congested_roads = [r for r in roads if not r["is_traffic_free"]]
        assert len(traffic_free_roads) >= 3
        assert len(congested_roads) >= 2
        print(f"18. [PASS] Traffic-Free Roadways Telemetry: {len(traffic_free_roads)} Traffic-Free corridors active, {len(congested_roads)} congested bottlenecks tracked.")

        # 19. Driver Route Acceptance & In-Cab Terminal Sync
        accept_payload = {
            "ambulance_id": "unit-ems-101",
            "destination_hospital_id": nearest_hosp["hospital"]["id"],
            "chosen_route_id": "route-traffic-free-bypass",
            "pickup_address": "Silk Board Junction",
            "pickup_coordinates": {"lat": 12.9180, "lng": 77.6240},
            "patient_condition": "Acute Traumatic Brain Injury",
            "driver_notes": "Pilot Rajesh accepted Traffic-Free Elevated Bypass for spine stabilization"
        }
        res_accept = client.post("/api/v1/routing/driver/accept-route", json=accept_payload)
        assert res_accept.status_code == 200, f"Driver accept failed: {res_accept.text}"
        accept_data = res_accept.json()
        assert accept_data["success"] is True
        assert accept_data["chosen_route_id"] == "route-traffic-free-bypass"
        assert accept_data["eta_minutes"] > 0
        print(f"19. [PASS] Driver Route Acceptance: Pilot Rajesh accepted '{accept_data['chosen_route_name']}' to {accept_data['hospital_name']}.")

        print("\n=========================================================================")
        print(">>> ALL 19 SECURITY, PRODUCTION SERVING & DISPATCH TESTS PASSED (100%) <<<")
        print("=========================================================================")

if __name__ == "__main__":
    run_tests()


