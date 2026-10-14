import React, { useState } from 'react';
import { 
  Incident, ResponderUnit, IoTSensor, PriorityLevel,
  Hospital, TrafficSignal, GreenCorridorTransitSession
} from '../types';
import { 
  AlertTriangle, Radio, ZoomIn, ZoomOut, RotateCcw, Crosshair, Building2,
  Zap, CheckCircle2, Compass, Activity, MapPin, Truck, Satellite, Layers, Globe
} from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  units: ResponderUnit[];
  sensors: IoTSensor[];
  hospitals?: Hospital[];
  trafficSignals?: TrafficSignal[];
  activeCorridor?: GreenCorridorTransitSession | null;
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onSelectUnit?: (unit: ResponderUnit) => void;
}

type HoveredMapNode = 
  | { type: 'hospital'; data: Hospital; x: number; y: number }
  | { type: 'signal'; data: TrafficSignal; x: number; y: number }
  | { type: 'incident'; data: Incident; x: number; y: number }
  | { type: 'unit'; data: ResponderUnit; x: number; y: number };

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  units,
  sensors,
  hospitals = [],
  trafficSignals = [],
  activeCorridor = null,
  selectedIncident,
  onSelectIncident,
  onSelectUnit
}) => {
  // Map viewport bounds (Bengaluru Metro Corridor — India)
  // Lat: 12.890 (Electronic City / Bannerghatta Apollo) to 13.060 (Hebbal Flyover / Airport Corridor)
  // Lng: 77.520 (Majestic Metro Hub / West) to 77.720 (Whitefield Tech Corridor / East)
  const bounds = {
    minLat: 12.890,
    maxLat: 13.060,
    minLng: 77.520,
    maxLng: 77.720,
  };

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showUnits, setShowUnits] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [radarSweepEnabled, setRadarSweepEnabled] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite'>('satellite');
  const [hoveredNode, setHoveredNode] = useState<HoveredMapNode | null>(null);

  // Convert (lat, lng) to SVG viewBox coordinates (width: 1000, height: 700)
  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 1000;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 700;
    return { x, y };
  };

  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'P1': return '#FF1744';
      case 'P2': return '#FF9100';
      case 'P3': return '#FFD600';
      case 'P4': return '#00E5FF';
    }
  };

  // Quick focus presets
  const handleFocusIncident = () => {
    const p1 = incidents.find(i => i.priority === 'P1' && i.status !== 'RESOLVED') || incidents[0];
    if (p1) {
      onSelectIncident(p1);
      const pt = project(p1.coordinates.lat, p1.coordinates.lng);
      setZoomLevel(1.4);
      setMapPan({ x: 500 - pt.x, y: 350 - pt.y });
    }
  };

  const handleFocusCorridor = () => {
    if (activeCorridor && activeCorridor.corridor_waypoints.length > 0) {
      const mid = activeCorridor.corridor_waypoints[Math.floor(activeCorridor.corridor_waypoints.length / 2)];
      const pt = project(mid.lat, mid.lng);
      setZoomLevel(1.4);
      setMapPan({ x: 500 - pt.x, y: 350 - pt.y });
    } else {
      setZoomLevel(1.2);
    }
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setMapPan({ x: 0, y: 0 });
  };

  const activeIncidentCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const preemptedSignalsCount = trafficSignals.filter(s => s.state === 'EMERGENCY_OVERRIDE' || s.is_overridden).length;

  return (
    <div className="relative w-full h-[640px] bg-[#050B14] rounded-3xl border border-white/15 overflow-hidden shadow-2xl flex flex-col font-sans select-none">
      
      {/* Top Tactical HUD & Radar Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Radar Scanner Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-2xl glass-card-ultra border border-cyan-500/30 text-xs font-mono shadow-neon-blue">
          <div className="relative flex items-center justify-center w-5 h-5">
            <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">
                🇮🇳 BENGALURU URBAN GIS RADAR
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                112 / 108 LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {activeIncidentCount} Crises Reported • {preemptedSignalsCount} Green Corridors Active
            </p>
          </div>
        </div>

        {/* View Switcher: SATELLITE VIEW vs TACTICAL GRID */}
        <div className="pointer-events-auto flex items-center p-1 rounded-2xl glass-card-ultra border border-white/20 text-xs font-mono shadow-lg">
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              mapStyle === 'satellite'
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-400/50 shadow-neon-blue font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Switch to Real-time ISRO High-Resolution Satellite Map View"
          >
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span>🛰️ Satellite View</span>
          </button>

          <button
            onClick={() => setMapStyle('tactical')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              mapStyle === 'tactical'
                ? 'bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-emerald-200 border border-emerald-400/50 shadow-neon-green font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Switch to Tactical Cyber-GIS Grid View"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>🗺️ Tactical Grid</span>
          </button>
        </div>

        {/* Quick Focus Actions */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-card-ultra border border-white/15 text-xs font-mono">
          <button
            onClick={handleFocusIncident}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition flex items-center gap-1 text-[11px]"
            title="Focus Critical Incident"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Focus P1 Crisis</span>
          </button>

          <button
            onClick={handleFocusCorridor}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition flex items-center gap-1 text-[11px]"
            title="Focus Green Corridor"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Focus Corridor</span>
          </button>

          <button
            onClick={() => setRadarSweepEnabled(!radarSweepEnabled)}
            className={`px-2.5 py-1 rounded-xl border transition flex items-center gap-1 text-[11px] ${
              radarSweepEnabled 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Toggle Live Radar Sweep Beam"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar {radarSweepEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Zoom & View Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-2xl glass-card-ultra border border-white/15 text-xs">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.4))}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Satellite Recon Telemetry HUD Banner (Shown in Satellite View) */}
      {mapStyle === 'satellite' && (
        <div className="absolute top-16 left-4 z-20 pointer-events-none flex flex-col gap-1 text-[10px] font-mono text-cyan-300/80 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white tracking-widest uppercase">ISRO CARTOSAT-3 / EOS-04 ORBITAL RECON</span>
          </div>
          <div className="text-[9px] text-slate-300 flex items-center gap-3">
            <span>RES: 0.25m/PX</span>
            <span>ALT: 505 KM LEO</span>
            <span>BAND: TRUE-COLOR VNIR</span>
            <span>CLOUD: 0.0%</span>
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      <div className={`flex-1 w-full h-full relative overflow-hidden ${mapStyle === 'satellite' ? 'bg-[#0a1219]' : 'bg-[#070C16]'}`}>
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ 
            transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Dark Urban Grid Pattern for Tactical View */}
            <pattern id="urbanGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.035)" strokeWidth="1" />
            </pattern>

            {/* Satellite Terrain Texture Pattern (Photorealistic Terrain Grain) */}
            <pattern id="satelliteTerrainPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#0C151F" />
              <circle cx="10" cy="10" r="1.5" fill="rgba(255, 255, 255, 0.04)" />
              <circle cx="28" cy="22" r="1.8" fill="rgba(14, 165, 233, 0.03)" />
              <circle cx="18" cy="32" r="1.2" fill="rgba(16, 185, 129, 0.04)" />
              <path d="M 0 20 Q 20 22 40 18" stroke="rgba(255, 255, 255, 0.02)" fill="none" />
            </pattern>

            {/* Satellite Lush Greenery Pattern (Cubbon Park / Lalbagh) */}
            <pattern id="satelliteVegetationPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#0A2419" />
              <circle cx="4" cy="4" r="3" fill="#0E3D29" />
              <circle cx="12" cy="12" r="3.5" fill="#134E35" />
              <circle cx="12" cy="4" r="2" fill="#166542" />
            </pattern>

            {/* Satellite Water Ripples Gradient (Ulsoor / Bellandur Lakes) */}
            <linearGradient id="satelliteWaterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#082032" />
              <stop offset="50%" stopColor="#0B2F48" />
              <stop offset="100%" stopColor="#051624" />
            </linearGradient>

            {/* Tactical Water Gradient */}
            <linearGradient id="tacticalWaterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#071322" />
              <stop offset="50%" stopColor="#0B1C33" />
              <stop offset="100%" stopColor="#05101E" />
            </linearGradient>

            {/* Radial Glows */}
            <radialGradient id="p1CrisisGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 23, 68, 0.5)" />
              <stop offset="60%" stopColor="rgba(255, 23, 68, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 23, 68, 0)" />
            </radialGradient>

            <radialGradient id="greenHighwayGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 230, 118, 0.5)" />
              <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
            </radialGradient>

            <radialGradient id="hospitalBlueGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.45)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
            </radialGradient>

            {/* Radar Beam Gradient */}
            <linearGradient id="radarBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 229, 255, 0)" />
              <stop offset="70%" stopColor="rgba(0, 229, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(0, 229, 255, 0.35)" />
            </linearGradient>

            {/* Shadow Filter for Elevated Flyovers */}
            <filter id="flyoverShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* 1. BASE TERRAIN LAYER (SATELLITE OR TACTICAL) */}
          {mapStyle === 'satellite' ? (
            <g id="satellite-base-layer">
              <rect width="1000" height="700" fill="#0B1520" />
              <rect width="1000" height="700" fill="url(#satelliteTerrainPattern)" opacity="0.9" />

              {/* Urban Built-up Density Grids (Bengaluru Commercial & Residential Clusters) */}
              {/* Tech Sector A: Whitefield IT Hub */}
              <rect x="730" y="240" width="230" height="260" fill="#121D2A" opacity="0.65" rx="6" />
              {/* Central CBD & MG Road */}
              <rect x="360" y="260" width="220" height="180" fill="#162232" opacity="0.75" rx="8" />
              {/* Koramangala & Silk Board Corridor */}
              <rect x="420" y="440" width="250" height="220" fill="#14202E" opacity="0.7" rx="8" />
              {/* Hebbal North Corridor */}
              <rect x="320" y="50" width="260" height="180" fill="#111B27" opacity="0.6" rx="8" />

              {/* Simulated Isometric 3D Commercial Building Footprints */}
              <g fill="#1E2E42" stroke="#2D435E" strokeWidth="0.8" opacity="0.75">
                <rect x="390" y="290" width="45" height="35" rx="2" filter="url(#flyoverShadow)" />
                <rect x="450" y="300" width="55" height="40" rx="2" filter="url(#flyoverShadow)" />
                <rect x="420" y="350" width="60" height="30" rx="2" filter="url(#flyoverShadow)" />
                <rect x="760" y="280" width="65" height="50" rx="2" filter="url(#flyoverShadow)" />
                <rect x="840" y="310" width="70" height="45" rx="2" filter="url(#flyoverShadow)" />
                <rect x="780" y="380" width="85" height="55" rx="2" filter="url(#flyoverShadow)" />
                <rect x="460" y="470" width="60" height="45" rx="2" filter="url(#flyoverShadow)" />
                <rect x="540" y="500" width="55" height="50" rx="2" filter="url(#flyoverShadow)" />
              </g>

              {/* Satellite Greenery & Botanical Parks */}
              {/* Cubbon Park Enclave (Near MG Road) */}
              <g id="cubbon-park">
                <polygon
                  points="340,280 430,260 440,340 370,360 330,320"
                  fill="url(#satelliteVegetationPattern)"
                  stroke="#166542"
                  strokeWidth="1.5"
                  filter="url(#flyoverShadow)"
                />
                <text x="350" y="315" fill="#4ADE80" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  🌳 CUBBON PARK BIOSPHERE
                </text>
              </g>

              {/* Lalbagh Botanical Gardens (South of Central CBD) */}
              <g id="lalbagh-gardens">
                <ellipse
                  cx="370"
                  cy="460"
                  rx="65"
                  ry="45"
                  fill="url(#satelliteVegetationPattern)"
                  stroke="#166542"
                  strokeWidth="1.5"
                  filter="url(#flyoverShadow)"
                />
                <text x="325" y="465" fill="#4ADE80" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  🌿 LALBAGH BOTANICAL
                </text>
              </g>

              {/* Satellite Lakes with Shoreline Embankments */}
              {/* Ulsoor Lake */}
              <g id="ulsoor-lake">
                <path
                  d="M 520 250 Q 560 230 580 260 T 570 310 T 530 330 T 500 290 Z"
                  fill="url(#satelliteWaterGradient)"
                  stroke="#0284C7"
                  strokeWidth="2"
                  filter="url(#flyoverShadow)"
                />
                <text x="515" y="285" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  💧 ULSOOR LAKE
                </text>
              </g>

              {/* Bellandur Lake Watershed */}
              <g id="bellandur-lake">
                <path
                  d="M 680 450 Q 760 410 820 440 T 840 510 T 770 540 T 700 500 Z"
                  fill="url(#satelliteWaterGradient)"
                  stroke="#0284C7"
                  strokeWidth="2"
                  filter="url(#flyoverShadow)"
                />
                <text x="720" y="480" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  💧 BELLANDUR LAKE BASIN
                </text>
              </g>

              {/* Sankey Tank (North West) */}
              <g id="sankey-tank">
                <ellipse
                  cx="280"
                  cy="170"
                  rx="40"
                  ry="25"
                  fill="url(#satelliteWaterGradient)"
                  stroke="#0284C7"
                  strokeWidth="1.5"
                />
                <text x="250" y="174" fill="#38BDF8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                  SANKEY TANK
                </text>
              </g>

              {/* Satellite Latitude / Longitude Recon Grid Overlay */}
              <g stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" strokeDasharray="3 3">
                <line x1="0" y1="175" x2="1000" y2="175" />
                <line x1="0" y1="350" x2="1000" y2="350" />
                <line x1="0" y1="525" x2="1000" y2="525" />
                <line x1="250" y1="0" x2="250" y2="700" />
                <line x1="500" y1="0" x2="500" y2="700" />
                <line x1="750" y1="0" x2="750" y2="700" />
              </g>
            </g>
          ) : (
            /* Tactical Cyber Grid View */
            <g id="tactical-base-layer">
              <rect width="1000" height="700" fill="#070C16" />
              <rect width="1000" height="700" fill="url(#urbanGrid)" />

              {/* District Zoned Outlines */}
              {/* Central CBD & MG Road */}
              <polygon
                points="340,240 600,240 600,420 340,420"
                fill="rgba(30, 41, 59, 0.35)"
                stroke="rgba(0, 229, 255, 0.2)"
                strokeWidth="1"
              />
              <text x="355" y="260" fill="rgba(0, 229, 255, 0.5)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
                CENTRAL CBD & MG ROAD METRO HUB
              </text>

              {/* Koramangala & Silk Board */}
              <polygon
                points="400,430 720,430 720,680 400,680"
                fill="rgba(30, 41, 59, 0.3)"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth="1"
              />
              <text x="415" y="450" fill="rgba(16, 185, 129, 0.5)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
                KORAMANGALA & SILK BOARD INTERCHANGE
              </text>

              {/* Whitefield IT Expressway */}
              <polygon
                points="680,200 980,200 980,520 680,520"
                fill="rgba(30, 41, 59, 0.3)"
                stroke="rgba(245, 158, 11, 0.2)"
                strokeWidth="1"
              />
              <text x="700" y="225" fill="rgba(245, 158, 11, 0.5)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
                WHITEFIELD TECH & ORR INDUSTRIAL CORRIDOR
              </text>

              {/* Hebbal North Express Corridor */}
              <polygon
                points="240,40 640,40 640,220 240,220"
                fill="rgba(30, 41, 59, 0.25)"
                stroke="rgba(99, 102, 241, 0.2)"
                strokeWidth="1"
              />
              <text x="255" y="65" fill="rgba(99, 102, 241, 0.5)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
                HEBBAL & NORTH BENGALURU EXPRESSWAY (NH-44)
              </text>

              {/* Tactical Water Bodies */}
              <path
                d="M 520 260 Q 550 240 570 270 T 560 310 T 520 320 Z"
                fill="url(#tacticalWaterGradient)"
                stroke="rgba(0, 229, 255, 0.4)"
                strokeWidth="1.5"
              />
              <text x="515" y="290" fill="rgba(0, 229, 255, 0.5)" fontSize="8" fontFamily="monospace">ULSOOR LAKE</text>

              <path
                d="M 700 460 Q 770 420 820 450 T 830 510 T 760 530 Z"
                fill="url(#tacticalWaterGradient)"
                stroke="rgba(0, 229, 255, 0.4)"
                strokeWidth="1.5"
              />
              <text x="730" y="485" fill="rgba(0, 229, 255, 0.5)" fontSize="8" fontFamily="monospace">BELLANDUR LAKE</text>
            </g>
          )}

          {/* 2. INDIAN METROPOLITAN HIGHWAYS & ARTERIAL CORRIDORS */}
          {/* A. Outer Ring Road (ORR) Arterial Spine (Hebbal -> Marathahalli -> Silk Board) */}
          <g id="outer-ring-road">
            <path
              d="M 350 110 Q 750 160 840 400 T 520 595"
              stroke={mapStyle === 'satellite' ? '#171D26' : '#1E293B'}
              strokeWidth="16"
              fill="none"
              filter={mapStyle === 'satellite' ? 'url(#flyoverShadow)' : undefined}
            />
            <path
              d="M 350 110 Q 750 160 840 400 T 520 595"
              stroke={mapStyle === 'satellite' ? '#2B394A' : 'rgba(0, 229, 255, 0.3)'}
              strokeWidth="10"
              fill="none"
            />
            {/* White/Yellow Lane Dividers */}
            <path
              d="M 350 110 Q 750 160 840 400 T 520 595"
              stroke={mapStyle === 'satellite' ? '#FBBF24' : '#FFFFFF'}
              strokeWidth="1.5"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.8"
            />
            <text x="750" y="320" fill="#94A3B8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              OUTER RING ROAD (ORR ARTERIAL)
            </text>
          </g>

          {/* B. Hosur Road & Electronic City Elevated Tollway (Silk Board -> Electronic City) */}
          <g id="hosur-road">
            <line
              x1="520" y1="595" x2="680" y2="700"
              stroke={mapStyle === 'satellite' ? '#171D26' : '#1E293B'}
              strokeWidth="18"
              filter={mapStyle === 'satellite' ? 'url(#flyoverShadow)' : undefined}
            />
            <line
              x1="520" y1="595" x2="680" y2="700"
              stroke={mapStyle === 'satellite' ? '#3B4D63' : 'rgba(16, 185, 129, 0.4)'}
              strokeWidth="12"
            />
            <line
              x1="520" y1="595" x2="680" y2="700"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <text x="560" y="650" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              HOSUR RD / E-CITY ELEVATED TOLLWAY (NH-44)
            </text>
          </g>

          {/* C. Silk Board Flyover Junction Hub (The Landmark Traffic Node) */}
          <g id="silk-board-hub" transform="translate(520, 595)">
            <circle cx="0" cy="0" r="24" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" filter="url(#flyoverShadow)" />
            <circle cx="0" cy="0" r="16" fill="#1E293B" stroke="#00E5FF" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="extrabold">
              SILK BOARD
            </text>
          </g>

          {/* D. MG Road & Brigade Road Boulevard (CBD Spine) */}
          <g id="mg-road-arterial">
            <line
              x1="220" y1="360" x2="640" y2="340"
              stroke={mapStyle === 'satellite' ? '#1E293B' : '#1E293B'}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <line
              x1="220" y1="360" x2="640" y2="340"
              stroke={mapStyle === 'satellite' ? '#475569' : 'rgba(0, 229, 255, 0.3)'}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <line
              x1="220" y1="360" x2="640" y2="340"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              opacity="0.8"
            />
            <text x="310" y="330" fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              MG ROAD & BRIGADE RD METRO BOULEVARD
            </text>
          </g>

          {/* E. Old Airport Road (Domlur Flyover -> Manipal Hospital -> HAL) */}
          <g id="old-airport-road">
            <line
              x1="450" y1="350" x2="800" y2="420"
              stroke={mapStyle === 'satellite' ? '#171D26' : '#1E293B'}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <line
              x1="450" y1="350" x2="800" y2="420"
              stroke={mapStyle === 'satellite' ? '#3B4D63' : 'rgba(148, 163, 184, 0.3)'}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <text x="560" y="405" fill="#64748B" fontSize="8" fontFamily="monospace">
              OLD AIRPORT ROAD (HAL ARTERIAL)
            </text>
          </g>

          {/* F. Hebbal Flyover & Kempegowda Airport Expressway (NH-44 North) */}
          <g id="hebbal-airport-expressway">
            <line
              x1="350" y1="110" x2="420" y2="0"
              stroke={mapStyle === 'satellite' ? '#171D26' : '#1E293B'}
              strokeWidth="16"
              filter={mapStyle === 'satellite' ? 'url(#flyoverShadow)' : undefined}
            />
            <line
              x1="350" y1="110" x2="420" y2="0"
              stroke={mapStyle === 'satellite' ? '#2B394A' : 'rgba(245, 158, 11, 0.4)'}
              strokeWidth="10"
            />
            <text x="375" y="55" fill="#F59E0B" fontSize="8" fontFamily="monospace" fontWeight="bold">
              HEBBAL FLYOVER (NH-44 AIRPORT TOLLWAY)
            </text>
          </g>

          {/* 3. ACTIVE GREEN CORRIDOR ARTERIAL PATH (GLOWING EMERALD SUPER-HIGHWAY) */}
          {activeCorridor && activeCorridor.corridor_waypoints.length >= 2 && (
            <g id="green-corridor-highway-glow">
              {activeCorridor.corridor_waypoints.map((pt, i) => {
                if (i === activeCorridor.corridor_waypoints.length - 1) return null;
                const p1 = project(pt.lat, pt.lng);
                const p2 = project(activeCorridor.corridor_waypoints[i+1].lat, activeCorridor.corridor_waypoints[i+1].lng);
                return (
                  <g key={`corridor-seg-${i}`}>
                    {/* Broad outer neon emerald glow */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#00E676"
                      strokeWidth="18"
                      strokeOpacity="0.3"
                      strokeLinecap="round"
                    />
                    {/* Mid ribbon */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#00E676"
                      strokeWidth="8"
                      strokeOpacity="0.9"
                      strokeLinecap="round"
                    />
                    {/* Animated running pulse dashes */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="10 8"
                      className="animate-pulse"
                    />
                  </g>
                );
              })}

              {/* Green Corridor Title Banner along route */}
              {activeCorridor.corridor_waypoints[0] && (
                <g transform={`translate(${project(activeCorridor.corridor_waypoints[0].lat, activeCorridor.corridor_waypoints[0].lng).x - 40}, ${project(activeCorridor.corridor_waypoints[0].lat, activeCorridor.corridor_waypoints[0].lng).y - 25})`}>
                  <rect width="210" height="22" rx="6" fill="rgba(6, 78, 59, 0.95)" stroke="#00E676" strokeWidth="1.5" />
                  <text x="105" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    🟢 108 GREEN CORRIDOR IN-TRANSIT
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 4. RADAR SWEEP BEAM ANIMATION */}
          {radarSweepEnabled && (
            <g id="radar-sweep-cone" className="pointer-events-none">
              <circle cx="500" cy="350" r="340" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="500" cy="350" r="220" fill="none" stroke="rgba(0, 229, 255, 0.12)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="500" cy="350" r="100" fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth="1" />
              
              {/* Rotating sweeping radar needle */}
              <g className="origin-[500px_350px] animate-[spin_8s_linear_infinite]">
                <line x1="500" y1="350" x2="840" y2="350" stroke="rgba(0, 229, 255, 0.65)" strokeWidth="2" />
                <polygon points="500,350 840,310 840,350" fill="url(#radarBeamGradient)" opacity="0.75" />
              </g>
            </g>
          )}

          {/* 5. SMART TRAFFIC LIGHT NODES (With Preemption Glow) */}
          {showSignals && trafficSignals.map(sig => {
            const { x, y } = project(sig.coordinates.lat, sig.coordinates.lng);
            const isGreen = sig.state === 'EMERGENCY_OVERRIDE' || sig.is_overridden;

            return (
              <g
                key={`sig-${sig.id}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setHoveredNode({ type: 'signal', data: sig, x, y })}
                onMouseEnter={() => setHoveredNode({ type: 'signal', data: sig, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* When preemption is active: pulsing beacon ring */}
                {isGreen && (
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill="none"
                    stroke="#00E676"
                    strokeWidth="2.5"
                    className="animate-ping"
                  />
                )}

                {/* 3-Lens Traffic Light Housing */}
                <rect
                  x={x - 9}
                  y={y - 14}
                  width="18"
                  height="28"
                  rx="6"
                  fill="#0B1322"
                  stroke={isGreen ? '#00E676' : '#FF1744'}
                  strokeWidth="1.5"
                />
                {/* Red Lens */}
                <circle cx={x} cy={y - 7} r="3" fill={isGreen ? '#475569' : '#FF1744'} />
                {/* Yellow Lens */}
                <circle cx={x} cy={y} r="3" fill="#475569" />
                {/* Green Lens */}
                <circle cx={x} cy={y + 7} r="3.5" fill={isGreen ? '#00E676' : '#475569'} className={isGreen ? 'animate-pulse' : ''} />

                {/* Label Badge */}
                <g transform={`translate(${x}, ${y + 22})`}>
                  <rect
                    x="-40"
                    y="0"
                    width="80"
                    height="14"
                    rx="4"
                    fill={isGreen ? 'rgba(6, 78, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
                    stroke={isGreen ? '#00E676' : '#475569'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="10"
                    textAnchor="middle"
                    fill={isGreen ? '#00E676' : '#94A3B8'}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isGreen ? '🟢 100% GREEN' : '🔴 RED CROSS'}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 6. RECEIVING TRAUMA HOSPITALS (APOLLO, MANIPAL, VICTORIA, FORTIS) */}
          {showHospitals && hospitals.map(hosp => {
            const { x, y } = project(hosp.coordinates.lat, hosp.coordinates.lng);
            return (
              <g
                key={`hosp-${hosp.id}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setHoveredNode({ type: 'hospital', data: hosp, x, y })}
                onMouseEnter={() => setHoveredNode({ type: 'hospital', data: hosp, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Hospital Ambient Aura */}
                <circle cx={x} cy={y} r="28" fill="url(#hospitalBlueGlow)" />
                
                {/* Hospital Shield */}
                <circle cx={x} cy={y} r="15" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
                
                {/* Red/White Medical Cross */}
                <rect x={x - 2} y={y - 8} width="4" height="16" fill="#FFFFFF" rx="1" />
                <rect x={x - 8} y={y - 2} width="16" height="4" fill="#FFFFFF" rx="1" />

                {/* Hospital Name & Ready Bays Badge */}
                <g transform={`translate(${x}, ${y + 22})`}>
                  <rect
                    x="-65"
                    y="0"
                    width="130"
                    height="16"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#6366F1"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    fill="#C7D2FE"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    🏥 {hosp.name.split(' ')[0]} ({hosp.available_trauma_bays} Bays)
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. ACTIVE EMERGENCY INCIDENTS (RADAR BEACONS) */}
          {incidents.map(inc => {
            const { x, y } = project(inc.coordinates.lat, inc.coordinates.lng);
            const isSelected = selectedIncident?.id === inc.id;
            const isResolved = inc.status === 'RESOLVED';
            const priorityColor = isResolved ? '#64748B' : getPriorityColor(inc.priority);

            return (
              <g
                key={`incident-${inc.id}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectIncident(inc)}
                onMouseEnter={() => setHoveredNode({ type: 'incident', data: inc, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Sonar Beacon Ping Waves */}
                {!isResolved && inc.priority === 'P1' && (
                  <>
                    <circle cx={x} cy={y} r="32" fill="none" stroke="#FF1744" strokeWidth="1.5" className="animate-ping" opacity={0.6} />
                    <circle cx={x} cy={y} r="20" fill="none" stroke="#FF1744" strokeWidth="2" className="animate-pulse" />
                  </>
                )}

                {/* Evacuation Radius Shaded Area */}
                {!isResolved && (
                  <circle
                    cx={x}
                    cy={y}
                    r={(inc.triage?.evacuation_radius_meters || 150) * 0.12}
                    fill={inc.category === 'FLOOD_WATER' ? 'rgba(0, 145, 234, 0.15)' : 'url(#p1CrisisGlow)'}
                    stroke={priorityColor}
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Main Diamond Emergency Beacon */}
                <polygon
                  points={`${x},${y - 14} ${x + 14},${y} ${x},${y + 14} ${x - 14},${y}`}
                  fill={priorityColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? "3" : "1.8"}
                  className="shadow-2xl"
                />

                {/* Priority Label Inside Diamond */}
                <text x={x} y={y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="extrabold" fontFamily="monospace">
                  {inc.priority}
                </text>

                {/* High-Visibility Crisis Name Plate */}
                <g transform={`translate(${x + 18}, ${y - 12})`}>
                  <rect
                    x="0"
                    y="0"
                    width={inc.title.length * 6.5 + 24}
                    height="24"
                    rx="6"
                    fill="rgba(8, 12, 22, 0.95)"
                    stroke={priorityColor}
                    strokeWidth={isSelected ? "2" : "1.2"}
                  />
                  <text x="8" y="11" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {inc.title.slice(0, 26)}{inc.title.length > 26 ? '...' : ''}
                  </text>
                  <text x="8" y="20" fill="#94A3B8" fontSize="7" fontFamily="monospace">
                    {inc.location_address.slice(0, 30)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 8. INDIAN FIRST RESPONDER UNITS (108 AMBULANCES, FIRE 101, POLICE 100) */}
          {showUnits && units.map(unit => {
            const { x, y } = project(unit.location.lat, unit.location.lng);
            const isEnRoute = unit.status === 'EN_ROUTE' || unit.status === 'DISPATCHED';

            return (
              <g
                key={`unit-${unit.id}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectUnit && onSelectUnit(unit)}
                onMouseEnter={() => setHoveredNode({ type: 'unit', data: unit, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Motion Vector Trail if En Route */}
                {isEnRoute && (
                  <circle cx={x} cy={y} r="18" fill="none" stroke="#00E5FF" strokeWidth="2" className="animate-ping" />
                )}

                {/* Unit Chassis */}
                <rect
                  x={x - 10}
                  y={y - 10}
                  width="20"
                  height="20"
                  rx="6"
                  fill={isEnRoute ? '#00E5FF' : '#1E293B'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                
                {/* Unit Symbol */}
                <text x={x} y={y + 4} textAnchor="middle" fill={isEnRoute ? '#050B14' : '#00E5FF'} fontSize="9" fontWeight="extrabold" fontFamily="monospace">
                  {unit.callsign.includes('108') || unit.callsign.includes('AMB') ? '🚑' : unit.callsign.includes('FIRE') || unit.callsign.includes('SDRF') ? '🚒' : unit.callsign.includes('POLICE') ? '🚓' : '🛸'}
                </text>

                {/* Callsign Tag */}
                <g transform={`translate(${x}, ${y + 14})`}>
                  <rect x="-34" y="0" width="68" height="13" rx="3" fill="rgba(8, 12, 22, 0.9)" stroke="#00E5FF" strokeWidth="0.8" />
                  <text x="0" y="9" textAnchor="middle" fill="#E2E8F0" fontSize="7" fontFamily="monospace" fontWeight="bold">
                    {unit.callsign.split(' ')[0]} ({unit.status === 'IDLE' ? 'FREE' : 'BUSY'})
                  </text>
                </g>
              </g>
            );
          })}

        </svg>

        {/* Hover Tooltip Overlay Card */}
        {hoveredNode && (
          <div
            className="absolute z-40 pointer-events-none glass-card-ultra border border-cyan-400 p-3.5 rounded-2xl shadow-2xl text-xs font-mono max-w-sm animate-modal-in"
            style={{
              left: Math.min(hoveredNode.x + 20, 680),
              top: Math.min(hoveredNode.y - 20, 480)
            }}
          >
            {hoveredNode.type === 'hospital' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                  <Building2 className="w-4 h-4" />
                  <span>{hoveredNode.data.name}</span>
                </div>
                <p className="text-[11px] text-slate-300">{hoveredNode.data.address}</p>
                <div className="flex items-center justify-between text-[11px] text-emerald-300 pt-1 border-t border-white/10">
                  <span>Trauma Bays: {hoveredNode.data.available_trauma_bays}/{hoveredNode.data.total_trauma_bays}</span>
                  <span className="font-bold text-cyan-300">{hoveredNode.data.trauma_level}</span>
                </div>
              </div>
            )}

            {hoveredNode.type === 'signal' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>{hoveredNode.data.intersection_name}</span>
                </div>
                <p className="text-[11px]">
                  State: <strong className={hoveredNode.data.is_overridden ? 'text-emerald-400' : 'text-rose-400'}>
                    {hoveredNode.data.is_overridden ? '🟢 100% EMERGENCY GREEN OVERRIDE' : '🔴 RED (NORMAL CROSS TRAFFIC)'}
                  </strong>
                </p>
                {hoveredNode.data.distance_to_active_ambulance_km && (
                  <p className="text-[10px] text-cyan-300">
                    Distance to approaching ambulance: <strong>{hoveredNode.data.distance_to_active_ambulance_km} km</strong>
                  </p>
                )}
              </div>
            )}

            {hoveredNode.type === 'incident' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500 font-bold">
                    {hoveredNode.data.priority}
                  </span>
                  <span>{hoveredNode.data.title}</span>
                </div>
                <p className="text-[11px] text-slate-300">{hoveredNode.data.location_address}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2">{hoveredNode.data.raw_description}</p>
                <div className="text-[10px] text-rose-300 font-bold pt-1 border-t border-white/10 flex items-center justify-between">
                  <span>Casualties: ~{hoveredNode.data.triage?.estimated_victims || 0}</span>
                  <span>Severity: {hoveredNode.data.triage?.severity_score || 70}/100</span>
                </div>
              </div>
            )}

            {hoveredNode.type === 'unit' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Truck className="w-4 h-4" />
                  <span>{hoveredNode.data.callsign}</span>
                </div>
                <p className="text-[11px] text-slate-300">Type: {hoveredNode.data.type}</p>
                <p className="text-[10px] text-slate-400">Status: <strong className="text-white">{hoveredNode.data.status}</strong></p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Crystal-Clear Interactive Map Legend Footer */}
      <div className="bg-slate-950/90 border-t border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rotate-45 bg-rose-500 border border-white shadow-neon-red inline-block" />
            <span className="text-slate-200 font-bold">🚨 112 Crisis Beacon</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-cyan-400 border border-white inline-block" />
            <span className="text-slate-200 font-bold">🚑 108 Emergency Ambulance</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded-full bg-emerald-400 shadow-neon-green inline-block" />
            <span className="text-emerald-300 font-bold">🟢 Green Corridor (&lt; 1 km Preemption)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-indigo-300 inline-block flex items-center justify-center text-[8px] text-white font-bold">+</span>
            <span className="text-indigo-200 font-bold">🏥 Trauma Receiving Center</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            {mapStyle === 'satellite' ? '🛰️ ISRO High-Res Satellite View Active' : '🗺️ Tactical Grid Active'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            RADAR 100% ONLINE
          </span>
        </div>
      </div>

    </div>
  );
};
