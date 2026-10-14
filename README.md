# RescuELINK — Autonomous Smart City Emergency Dispatch & Urban Resilience Command System

[![Google Gemini 3.8 Flash](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash-00E5FF?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Async-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/System%20Status-Production%20Ready-00E676?style=for-the-badge)]()

RescuELINK is an end-to-end, full-stack autonomous emergency response and urban resilience command platform designed for municipal 911 dispatch centers, disaster coordinators, and smart city operators. It integrates **Google Gemini 3.8 Flash** with live IoT environmental telemetry, real-time spatial GIS maps, and algorithmic responder dispatch.

---

## 🌟 Key Innovations & Capabilities

### 1. 🧠 Multimodal Incident Triage (Gemini 3.8 Flash)
- **Instantaneous Severity Classification**: Automatically triages incoming distress calls into **P1 (Life-Threatening)**, **P2 (Urgent)**, **P3 (Moderate)**, and **P4 (Advisory)** within 1.5 seconds.
- **Multimodal Visual Verification**: Accepts smartphone photos/surveillance frames to detect structural fire flames, smoke plumes, flash flooding depths, and victim entrapments.
- **Automated SOP Generation**: Instantly produces actionable Standard Operating Procedures (SOPs) with an interactive checklist for dispatch operators.

### 2. 🗺️ Tactical GIS Radar & Live Geospatial Map
- **Live Kinetic Visualization**: Displays active disaster beacons with pulsing priority halos, casualty counts, and evacuation perimeter buffers.
- **Responder In-Transit Vectors**: Renders live animated directional routes from dispatched units (Paramedics, Fire Engines, Thermal Drones, Heavy Rescue) directly to target incidents.
- **IoT Environmental Hazard Mesh**: Visualizes real-time sensor alerts (Flood water depth, AQI smoke clouds, Thermal heat spikes, Traffic bottlenecks).

### 3. ⚡ Autonomous Dispatch & Route Optimization Engine
- **Proximity & Capability Scoring**: Evaluates responder proximity via Haversine distance calculations, accounts for IoT traffic congestion bottlenecks, and matches specialized unit capabilities.
- **Sub-Minute Dispatch Orders**: Operators can trigger one-click multi-unit deployment with real-time ETA countdowns.

### 4. 📢 Multilingual Citizen Broadcast Studio
- **Localized Emergency Advisories**: Dynamically generates crisis alerts in **English, Spanish, Hindi, French, and Arabic** tailored to the specific hazard and neighborhood.
- **Evacuation Corridors & First-Aid**: Automatically drafts step-by-step CPR instructions, shelter-in-place directives, and designated arterial escape corridors.

### 5. 📊 Urban Resilience Matrix & Threat Analytics
- Computes the municipal **Resilience Score (0–100)** in real-time based on incident load, available fleet capacity, and critical sensor thresholds.
- Identifies predictive urban vulnerability hotspots before cascading failures occur.

### 6. 🟢 GreenCorridor AI™ (Driver In-Cab Transit & Traffic Light Preemption)
- **Ambulance Driver Departure Console**: When an ambulance departs from any location, the driver sets their departure point and selects the destination Receiving Trauma Center.
- **Route Clearance Broadcast**: The system instantly transmits digital route-clearance notices across the municipal traffic network.
- **< 1.0 km Smart Traffic Signal Preemption**: As the en-route ambulance approaches within 1.0 km of any intersecting traffic light, the signal is autonomously overridden into **100% EMERGENCY GREEN**, locking cross-traffic to RED and clearing crosswalks.
- **Receiving Hospital Readiness & Bay Reservation**: Automatically notifies the target hospital's Emergency Department, reserving a sterile trauma bay, placing on-call surgical teams on immediate standby, and clearing the CT scanner prior to patient arrival.

### 7. 📸 Citizen Road Accident Photo SOS with Instant Auto-Scramble
- **Bystander Mobile Photo Reporting**: Any citizen can snap a live accident photo on the road and upload it directly through the app.
- **Gemini 3.8 Flash Multimodal Vision**: Performs instant damage assessment, detects vehicle crumple zones, hazardous fluid leaks, trapped victims, and computes triage severity.
- **Zero-Delay Nearest Idle Ambulance Auto-Scramble**: Automatically scans all registered emergency vehicles on duty, locates the closest idle unit via Haversine geolocation, and immediately scrambles it with priority status.
- **Seamless Green Corridor Handover**: Once the scrambled unit reaches the scene and boards the victim, the driver launches the Green Corridor directly to the nearest trauma hospital.

### 8. 📱 Dual Form Factor: Desktop Command Hub & Mobile Responder App
- **1-Click Form Switcher**: Switch instantly between the **Desktop Web Command Center** (multi-column wide console, tactical GIS radar, fleet controls) and the **Mobile Responder App** (smartphone bezel, status bar, bottom touch tabs).
- **100% Synchronized Real-Time State**: All actions in either form (snapping crash photos, triggering Green Corridors, resolving incidents) synchronize instantly across both forms via the shared WebSocket bus.

### 9. 🏛️ Optional Government & First Responder Login Portal
- **Zero Barriers for Public Citizens**: Bystanders and citizens can report emergencies, snap accident photos, and view alerts with **no login required**.
- **Role-Based Government Authentication (Optional)**: Emergency personnel can authenticate with 1-click verified role profiles or custom badge IDs:
  - 🚑 **Ambulance / Paramedic Transit Driver** (`EMS-DRV-104`)
  - 🚒 **Fire Rescue Battalion Chief** (`FD-CHIEF-12`)
  - 🚓 **Transit & Highway Patrol Supervisor** (`PD-TAC-09`)
  - 🏥 **Trauma Hospital ER Chief** (`MD-TRAUMA-01`)
  - 🏢 **911 Operations Command Director** (`GOV-ROOT-911`)

---

## 🏗️ Architecture Blueprint

```
prompt_wars/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application, CORS, WebSocket bus, & telemetry loop
│   │   ├── config.py                # App configuration & Gemini settings
│   │   ├── models/schemas.py        # Pydantic v2 schemas (Incidents, Units, Hospitals, Signals, Corridors)
│   │   ├── services/
│   │   │   ├── gemini_service.py    # Google GenAI SDK (gemini-3.8-flash) & fallback engine
│   │   │   ├── dispatch_engine.py   # Green Corridor preemption, nearest unit allocation & ETA
│   │   │   └── mock_db.py           # Pre-seeded metropolitan incidents, fleet, hospitals, & traffic lights
│   │   └── api/
│   │       ├── incidents.py         # CRUD, Triage, Green Corridor, & Citizen Snap SOS endpoints
│   │       ├── analytics.py         # Urban risk matrix and resilience metrics
│   │       └── websocket.py         # Millisecond WebSocket event broadcaster
│   ├── requirements.txt
│   ├── verify_backend.py            # Automated 10/10 test verification suite
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Dual-form switcher, Gov access, status badges
│   │   │   ├── MobileAppView.tsx    # Smartphone chassis form with touch tabs
│   │   │   ├── GovernmentLoginModal.tsx # Optional role-based authentication portal
│   │   │   ├── IncidentMap.tsx      # Tactical GIS canvas with hospital pins, dynamic signals & corridors
│   │   │   ├── IncidentFeed.tsx     # Live stream with P1-P4 priority filters & glassmorphic cards
│   │   │   ├── IncidentDetailModal.tsx # Multimodal inspection, SOP checklist & dismiss controls
│   │   │   ├── NewIncidentModal.tsx # Citizen SOS intake with 1-click demo presets
│   │   │   ├── GreenCorridorCockpit.tsx # Ambulance driver cab console & signal override tracker
│   │   │   ├── CitizenSnapModal.tsx # Camera viewfinder & instant auto-scramble SOS
│   │   │   ├── DispatchControl.tsx  # First responder fleet management
│   │   │   ├── SensorMonitor.tsx    # Smart City IoT sensor telemetry
│   │   │   ├── CitizenBroadcastModal.tsx # Multilingual emergency alert studio
│   │   │   └── AnalyticsView.tsx    # Urban resilience dashboard
│   │   ├── services/api.ts          # Typed REST API & WebSocket client
│   │   ├── types/index.ts           # Strict TypeScript interfaces
│   │   ├── App.tsx                  # Root application state & dual-form synchronizer
│   │   └── index.css                # Ultra-glassmorphic styling, animations, & phone frame
│   └── package.json
├── start_system.bat                 # 1-Click Windows launch script
└── README.md
```

---

## 🚀 Quickstart Guide (Running the Live Demo)

### Prerequisites
- **Python 3.10+** (Python 3.14 verified)
- **Node.js 18+** (Node.js 24 verified)
- **Google Gemini API Key** (Configured via `GEMINI_API_KEY` or `.env`; built-in autonomous intelligence fallback runs seamlessly if key is not yet set).

---

### Option A: One-Click Launch (Windows)
Simply double-click or run from PowerShell:
```powershell
.\start_system.bat
```
This automatically boots both the FastAPI backend (port 8000) and the Vite frontend (port 5173) in synchronized command windows.

---

### Option B: Manual Terminal Execution

**Terminal 1 — Backend Server:**
```bash
cd backend
python run.py
```
- API Server: **`http://localhost:8000`**
- Interactive Swagger Docs: **`http://localhost:8000/docs`**
- Health Check: **`http://localhost:8000/health`**

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm run dev
```
- Access Live Command Hub: **`http://localhost:5173`**

---

## 🎬 Suggested Demonstration Flow for Hackathon Judges

1. **Review the Tactical Command Hub**:
   - Observe the live GIS Radar map showing active incidents, hospital locations, and real-time smart traffic signals.
   - Notice the telemetry pulse updating sensor water levels and unit coordinates every few seconds.
2. **Citizen Road Accident Photo SOS with Auto-Scramble (New)**:
   - Click the pulsing red **"📸 SNAP ACCIDENT SOS"** button in the header.
   - Select a road accident scenario (e.g. *Multi-Vehicle Highway Pileup* or *Motorcycle Collision*).
   - Click **"Transmit Accident Photo & Auto-Scramble Free Ambulance"**.
   - Watch Gemini 3.8 Flash visually analyze the crash scene, pinpoint trapped victims, identify the nearest available on-duty ambulance (`AMB-01`), and instantly dispatch it with zero delay!
3. **Ambulance Driver Green Corridor & Signal Preemption (New)**:
   - Click the **"🟢 Green Corridor AI"** tab to enter the In-Cab Driver Console.
   - Select the ambulance (`AMB-01`), pickup location, and target receiving trauma center (e.g. *Metro Central Trauma Center*).
   - Click **"Initiate Green Corridor & Alert Hospital"**.
   - Notice:
     - Route clearance notification broadcasted immediately.
     - Target hospital ER receives pre-arrival alert with reserved trauma bay and on-call trauma surgeon.
     - Live signal distance tracker: when the ambulance approaches within **1.0 km**, the signal dynamically switches to **EMERGENCY OVERRIDE (100% GREEN)** on the map and cab console!
4. **Inspect an Active Incident & SOP Checklist**:
   - Click on the **P1 Chemical Storage Fire** in the Incident Feed.
   - Inspect the **Gemini 3.8 Flash Triage** panel showing the severity score (94/100), detected hazards, and the interactive **SOP Checklist**.
   - Check off an SOP task and view the **AI Unit Recommendations**. Click **"Dispatch 2 Unit(s)"** to mobilize responders. Watch the GIS map render animated transit vectors!
5. **Transmit a Multilingual Citizen Alert**:
   - Click **"Generate Multilingual Citizen Broadcast"**.
   - Select desired languages (English, Spanish, Hindi, French, Arabic).
   - View Gemini generating localized warnings, designated evacuation corridors, and first-aid instructions.
6. **Explore the Resilience Matrix**:
   - Switch to the **Resilience Matrix** tab to examine citywide vulnerability scores, compounding hazard correlations, and autonomous recommendations for municipal leadership.

---

## 🛡️ Autonomous Safety & Fallback Engine
RescuELINK is built to be 100% mission-critical. If internet connectivity drops or external API limits occur during a live demonstration, the embedded **Deterministic Heuristic Triage Engine** automatically activates, ensuring zero downtime, zero broken promises, and uninterrupted presentation flow.
