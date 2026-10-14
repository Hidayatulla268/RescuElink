import React, { useState } from 'react';
import { 
  Incident, ResponderUnit, IoTSensor, PriorityLevel,
  Hospital, TrafficSignal, GreenCorridorTransitSession
} from '../types';
import { 
  Flame, Droplets, HeartPulse, Navigation, AlertTriangle, 
  Radio, Layers, ZoomIn, ZoomOut, RotateCcw, Crosshair, Shield, Eye, Building2,
  Zap, CheckCircle2, Compass, Activity, MapPin, Truck
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
  // Map viewport bounds (Metropolitan Bay Area)
  const bounds = {
    minLat: 37.745,
    maxLat: 37.800,
    minLng: -122.455,
    maxLng: -122.382,
  };

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showUnits, setShowUnits] = useState<boolean>(true);
  const [showHazards, setShowHazards] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [radarSweepEnabled, setRadarSweepEnabled] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite'>('tactical');
  const [hoveredNode, setHoveredNode] = useState<any>(null);

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
    <div className="relative w-full h-[640px] bg-[#060911] rounded-3xl border border-white/15 overflow-hidden shadow-2xl flex flex-col font-sans select-none">
      
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
                TACTICAL RADAR & ARTERIAL GIS
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {activeIncidentCount} Crises Detected • {preemptedSignalsCount} Signals Preempted
            </p>
          </div>
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
            <span>Focus Green Corridor</span>
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
            <span>Radar Sweep {radarSweepEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Zoom & View Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-2xl glass-card-ultra border border-white/15 text-xs">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.2))}
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

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#070C16]">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ 
            transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Dark Urban Grid Pattern */}
            <pattern id="urbanGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.035)" strokeWidth="1" />
            </pattern>

            {/* City Blocks Texture Pattern */}
            <pattern id="cityBlockPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="2" y="2" width="16" height="16" fill="rgba(14, 23, 42, 0.5)" rx="2" />
            </pattern>

            {/* Radial Glows */}
            <radialGradient id="p1CrisisGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 23, 68, 0.45)" />
              <stop offset="60%" stopColor="rgba(255, 23, 68, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 23, 68, 0)" />
            </radialGradient>

            <radialGradient id="greenHighwayGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 230, 118, 0.5)" />
              <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
            </radialGradient>

            <radialGradient id="hospitalBlueGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
            </radialGradient>

            {/* Water Wave Texture */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#071322" />
              <stop offset="50%" stopColor="#0B1C33" />
              <stop offset="100%" stopColor="#05101E" />
            </linearGradient>

            {/* Radar Beam Gradient */}
            <linearGradient id="radarBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 229, 255, 0)" />
              <stop offset="70%" stopColor="rgba(0, 229, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(0, 229, 255, 0.35)" />
            </linearGradient>
          </defs>

          {/* 1. BASE GEOGRAPHY & URBAN DISTRICTS */}
          <rect width="1000" height="700" fill="#070C16" />
          <rect width="1000" height="700" fill="url(#urbanGrid)" />

          {/* District Fills (Zoned Neighborhoods) */}
          {/* District A: Financial Skyscraper Core */}
          <polygon
            points="460,110 740,110 740,340 460,340"
            fill="rgba(30, 41, 59, 0.35)"
            stroke="rgba(0, 229, 255, 0.15)"
            strokeWidth="1"
          />
          <text x="475" y="130" fill="rgba(0, 229, 255, 0.45)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
            DOWNTOWN FINANCIAL & TECH CORE
          </text>

          {/* District B: Medical & Civic Center */}
          <polygon
            points="180,220 440,220 440,460 180,460"
            fill="rgba(30, 41, 59, 0.25)"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth="1"
          />
          <text x="195" y="240" fill="rgba(99, 102, 241, 0.5)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
            CIVIC CENTER & MEDICAL PLAZA
          </text>

          {/* District C: Industrial Port & Waterfront Pier */}
          <polygon
            points="640,360 880,360 860,680 640,680"
            fill="rgba(30, 41, 59, 0.3)"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="1"
          />
          <text x="655" y="380" fill="rgba(245, 158, 11, 0.45)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
            PORT LOGISTICS & CHEMICAL PIER
          </text>

          {/* District D: Mission Residential & Transit Hub */}
          <polygon
            points="180,480 500,480 500,680 180,680"
            fill="rgba(30, 41, 59, 0.25)"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="1"
          />
          <text x="195" y="500" fill="rgba(16, 185, 129, 0.45)" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
            MISSION ARTERIAL & TRANSIT HUB
          </text>

          {/* 2. BAY WATERFRONT & MARINA */}
          <path
            d="M 720 0 Q 760 180 730 350 T 840 500 T 800 700 L 1000 700 L 1000 0 Z"
            fill="url(#waterGradient)"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth="2"
          />
          
          {/* Piers extending into the bay */}
          <rect x="730" y="180" width="70" height="14" fill="#0E1E34" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1" rx="2" />
          <text x="740" y="190" fill="#64748B" fontSize="7" fontFamily="monospace">PIER 14</text>

          <rect x="715" y="270" width="85" height="16" fill="#0E1E34" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1" rx="2" />
          <text x="725" y="281" fill="#64748B" fontSize="7" fontFamily="monospace">BULK WHARF</text>

          <rect x="760" y="440" width="80" height="18" fill="#0E1E34" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" rx="2" />
          <text x="770" y="452" fill="#F59E0B" fontSize="7" fontFamily="monospace">PIER 38 (HAZMAT)</text>

          <text x="860" y="220" fill="rgba(0, 229, 255, 0.4)" fontSize="13" fontFamily="monospace" fontWeight="bold" letterSpacing="4">
            SAN FRANCISCO BAY
          </text>

          {/* 3. CITY ARTERIAL ROADS & FREEWAYS */}
          {/* Minor Street Grid Lines */}
          <g stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5" fill="none">
            <line x1="120" y1="180" x2="720" y2="180" />
            <line x1="120" y1="260" x2="720" y2="260" />
            <line x1="120" y1="420" x2="800" y2="420" />
            <line x1="120" y1="580" x2="800" y2="580" />
            
            <line x1="260" y1="80" x2="260" y2="680" />
            <line x1="380" y1="80" x2="380" y2="680" />
            <line x1="520" y1="80" x2="520" y2="680" />
            <line x1="660" y1="80" x2="660" y2="680" />
          </g>

          {/* Major High-Speed Arterials with Lane Dividers */}
          {/* Market Street Arterial (Diagonal Main Spine) */}
          <g id="market-street">
            <line x1="100" y1="620" x2="740" y2="200" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
            <line x1="100" y1="620" x2="740" y2="200" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="10" strokeLinecap="round" />
            <line x1="100" y1="620" x2="740" y2="200" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
            <text x="320" y="475" fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="bold" transform="rotate(-33 320 475)">
              MARKET ST ARTERIAL (MAIN TRANSIT)
            </text>
          </g>

          {/* Mission Street Boulevard */}
          <g id="mission-street">
            <line x1="120" y1="660" x2="750" y2="300" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
            <line x1="120" y1="660" x2="750" y2="300" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="6" strokeLinecap="round" />
            <text x="360" y="535" fill="#64748B" fontSize="8" fontFamily="monospace" transform="rotate(-30 360 535)">
              MISSION BLVD
            </text>
          </g>

          {/* Embarcadero Highway along the bay */}
          <g id="embarcadero-highway">
            <path d="M 720 30 Q 755 200 725 350 T 835 500 T 795 680" stroke="#1E293B" strokeWidth="12" fill="none" />
            <path d="M 720 30 Q 755 200 725 350 T 835 500 T 795 680" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="8" fill="none" />
            <text x="735" y="100" fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              EMBARCADERO COASTAL HWY
            </text>
          </g>

          {/* Bay Bridge I-80 Suspension Highway */}
          <g id="bay-bridge-i80">
            <line x1="720" y1="210" x2="990" y2="130" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
            <line x1="720" y1="210" x2="990" y2="130" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="6" strokeDasharray="6 3" strokeLinecap="round" />
            {/* Bridge Suspension Towers */}
            <circle cx="810" cy="183" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="910" cy="153" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="830" y="170" fill="#F59E0B" fontSize="8" fontFamily="monospace" fontWeight="bold">
              BAY BRIDGE (I-80 SKYWAY)
            </text>
          </g>

          {/* 4. ACTIVE GREEN CORRIDOR ARTERIAL PATH (GLOWING EMERALD SUPER-HIGHWAY) */}
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
                      strokeWidth="16"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                    />
                    {/* Mid ribbon */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#00E676"
                      strokeWidth="7"
                      strokeOpacity="0.85"
                      strokeLinecap="round"
                    />
                    {/* Animated white running pulse dashes */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeDasharray="10 8"
                      className="animate-pulse"
                    />
                  </g>
                );
              })}

              {/* Green Corridor Title Banner along route */}
              {activeCorridor.corridor_waypoints[0] && (
                <g transform={`translate(${project(activeCorridor.corridor_waypoints[0].lat, activeCorridor.corridor_waypoints[0].lng).x - 40}, ${project(activeCorridor.corridor_waypoints[0].lat, activeCorridor.corridor_waypoints[0].lng).y - 25})`}>
                  <rect width="180" height="20" rx="6" fill="rgba(6, 78, 59, 0.9)" stroke="#00E676" strokeWidth="1.5" />
                  <text x="90" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    🟢 GREEN CORRIDOR IN-TRANSIT
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 5. RADAR SWEEP BEAM ANIMATION */}
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

          {/* 6. SMART TRAFFIC LIGHT NODES */}
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
                    r="18"
                    fill="none"
                    stroke="#00E676"
                    strokeWidth="2"
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
                    x="-34"
                    y="0"
                    width="68"
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
                    {isGreen ? '100% GREEN' : 'SIGNAL RED'}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. RECEIVING TRAUMA HOSPITALS */}
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
                <circle cx={x} cy={y} r="26" fill="url(#hospitalBlueGlow)" />
                
                {/* Hospital Shield */}
                <circle cx={x} cy={y} r="15" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
                
                {/* Red/White Medical Cross */}
                <rect x={x - 2} y={y - 8} width="4" height="16" fill="#FFFFFF" rx="1" />
                <rect x={x - 8} y={y - 2} width="16" height="4" fill="#FFFFFF" rx="1" />

                {/* Hospital Name & Ready Bays Badge */}
                <g transform={`translate(${x}, ${y + 22})`}>
                  <rect
                    x="-55"
                    y="0"
                    width="110"
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

          {/* 8. ACTIVE EMERGENCY INCIDENTS (RADAR BEACONS) */}
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
                    {inc.title.slice(0, 24)}{inc.title.length > 24 ? '...' : ''}
                  </text>
                  <text x="8" y="20" fill="#94A3B8" fontSize="7" fontFamily="monospace">
                    {inc.location_address.slice(0, 28)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 9. FIRST RESPONDER EMERGENCY UNITS (AMBULANCES, FIRE, POLICE) */}
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
                  {unit.callsign.includes('AMB') || unit.callsign.includes('MEDIC') ? '🚑' : unit.callsign.includes('FIRE') ? '🚒' : '🚓'}
                </text>

                {/* Callsign Tag */}
                <g transform={`translate(${x}, ${y + 14})`}>
                  <rect x="-30" y="0" width="60" height="13" rx="3" fill="rgba(8, 12, 22, 0.9)" stroke="#00E5FF" strokeWidth="0.8" />
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
            <span className="text-slate-200 font-bold">🚨 911 Crisis Beacon</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-cyan-400 border border-white inline-block" />
            <span className="text-slate-200 font-bold">🚑 Emergency Responder</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded-full bg-emerald-400 shadow-neon-green inline-block" />
            <span className="text-emerald-300 font-bold">🟢 Green Corridor (Signal Override &lt; 1 km)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-indigo-300 inline-block flex items-center justify-center text-[8px] text-white font-bold">+</span>
            <span className="text-indigo-200 font-bold">🏥 Trauma Receiving Center</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            Click any beacon or marker on map to view tactical details
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            RADAR 100% ONLINE
          </span>
        </div>
      </div>

    </div>
  );
};
