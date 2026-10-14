import React, { useState } from 'react';
import { 
  Incident, ResponderUnit, IoTSensor, PriorityLevel, UnitStatus, SensorAlertStatus,
  Hospital, TrafficSignal, GreenCorridorTransitSession
} from '../types';
import { 
  Flame, Droplets, HeartPulse, Truck, Navigation, AlertTriangle, 
  Radio, Layers, ZoomIn, ZoomOut, RotateCcw, Crosshair, Shield, Eye, Building2
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
  // Map viewport bounds (Metropolitan Bay Area: Lat 37.745 to 37.800, Lng -122.455 to -122.382)
  const bounds = {
    minLat: 37.745,
    maxLat: 37.800,
    minLng: -122.455,
    maxLng: -122.382,
  };

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showUnits, setShowUnits] = useState<boolean>(true);
  const [showHazards, setShowHazards] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  // Convert (lat, lng) to SVG viewBox percentages (width: 1000, height: 700)
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

  return (
    <div className="relative w-full h-[620px] bg-[#070B12] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Tactical Header Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
          <Crosshair className="w-4 h-4 animate-spin text-cyan-400" />
          <span>TACTICAL GIS RADAR</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex flex-wrap items-center gap-2.5 text-slate-300">
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showHazards} 
              onChange={() => setShowHazards(!showHazards)}
              className="accent-cyan-500 rounded" 
            />
            <span>Hazards</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showUnits} 
              onChange={() => setShowUnits(!showUnits)}
              className="accent-cyan-500 rounded" 
            />
            <span>Units ({units.length})</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showSignals} 
              onChange={() => setShowSignals(!showSignals)}
              className="accent-emerald-500 rounded" 
            />
            <span className="text-emerald-300">Traffic Lights ({trafficSignals.length})</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showHospitals} 
              onChange={() => setShowHospitals(!showHospitals)}
              className="accent-indigo-500 rounded" 
            />
            <span className="text-indigo-300">Hospitals ({hospitals.length})</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showSensors} 
              onChange={() => setShowSensors(!showSensors)}
              className="accent-cyan-500 rounded" 
            />
            <span>IoT Grid</span>
          </label>
        </div>
      </div>

      {/* Map Zoom / Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80">
        <button
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full h-full relative overflow-hidden select-none cursor-crosshair">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="hazardRedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 23, 68, 0.28)" />
              <stop offset="100%" stopColor="rgba(255, 23, 68, 0)" />
            </radialGradient>
            <radialGradient id="hazardFloodGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 145, 234, 0.3)" />
              <stop offset="100%" stopColor="rgba(0, 145, 234, 0)" />
            </radialGradient>
            <radialGradient id="greenCorridorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 230, 118, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
            </radialGradient>
          </defs>

          {/* Tactical Background Grid */}
          <rect width="1000" height="700" fill="#070B12" />
          <rect width="1000" height="700" fill="url(#grid)" />

          {/* Shoreline */}
          <path
            d="M 680 0 Q 720 200 700 350 T 820 520 T 780 700 L 1000 700 L 1000 0 Z"
            fill="rgba(10, 25, 47, 0.6)"
            stroke="rgba(0, 229, 255, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text x="850" y="250" fill="rgba(0, 229, 255, 0.3)" fontSize="12" fontFamily="monospace" letterSpacing="4">
            BAY BASIN
          </text>

          {/* Arterial Roads */}
          <g stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2.5" fill="none">
            <line x1="120" y1="580" x2="720" y2="210" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="3" />
            <path d="M 450 490 Q 600 480 720 530" stroke="rgba(0, 176, 255, 0.4)" strokeWidth="4" />
            <line x1="720" y1="210" x2="980" y2="140" stroke="rgba(255, 176, 32, 0.35)" strokeWidth="3" strokeDasharray="6 3" />
            <line x1="280" y1="150" x2="280" y2="650" />
            <line x1="450" y1="120" x2="450" y2="650" />
            <line x1="620" y1="100" x2="620" y2="650" />
            <line x1="100" y1="350" x2="800" y2="350" />
            <line x1="100" y1="500" x2="750" y2="500" />
          </g>

          {/* Active Green Corridor Arterial Line */}
          {activeCorridor && activeCorridor.corridor_waypoints.length >= 2 && (
            <g key="green-corridor-path">
              {activeCorridor.corridor_waypoints.map((pt, i) => {
                if (i === activeCorridor.corridor_waypoints.length - 1) return null;
                const p1 = project(pt.lat, pt.lng);
                const p2 = project(activeCorridor.corridor_waypoints[i+1].lat, activeCorridor.corridor_waypoints[i+1].lng);
                return (
                  <g key={`corridor-seg-${i}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#00E676"
                      strokeWidth="6"
                      strokeOpacity="0.4"
                    />
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#00E676"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                      className="animate-pulse"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Hazard Zones */}
          {showHazards && incidents.filter(i => i.status !== 'RESOLVED').map(inc => {
            const { x, y } = project(inc.coordinates.lat, inc.coordinates.lng);
            const radiusPx = (inc.triage?.evacuation_radius_meters || 200) * 0.12;
            const isFlood = inc.category === 'FLOOD_WATER';
            return (
              <g key={`hazard-${inc.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={radiusPx}
                  fill={isFlood ? 'url(#hazardFloodGlow)' : 'url(#hazardRedGlow)'}
                  stroke={isFlood ? 'rgba(0, 145, 234, 0.5)' : 'rgba(255, 23, 68, 0.5)'}
                  strokeWidth="1"
                  strokeDasharray="5 3"
                />
              </g>
            );
          })}

          {/* Smart Traffic Signals Nodes */}
          {showSignals && trafficSignals.map(sig => {
            const { x, y } = project(sig.coordinates.lat, sig.coordinates.lng);
            const isGreen = sig.state === 'EMERGENCY_OVERRIDE' || sig.is_overridden;

            return (
              <g
                key={`sig-${sig.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({ type: 'signal', data: sig, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Preemption pulse if Green Override is active */}
                {isGreen && (
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="none"
                    stroke="#00E676"
                    strokeWidth="1.5"
                    className="animate-ping"
                  />
                )}
                <rect
                  x={x - 6}
                  y={y - 6}
                  width="12"
                  height="12"
                  rx="3"
                  fill={isGreen ? '#00E676' : '#FF1744'}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
                <text x={x} y={y + 14} textAnchor="middle" fill={isGreen ? '#00E676' : '#94A3B8'} fontSize="7" fontFamily="monospace">
                  {isGreen ? '100% GREEN' : 'RED'}
                </text>
              </g>
            );
          })}

          {/* Hospitals */}
          {showHospitals && hospitals.map(hosp => {
            const { x, y } = project(hosp.coordinates.lat, hosp.coordinates.lng);
            return (
              <g
                key={`hosp-${hosp.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({ type: 'hospital', data: hosp, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx={x} cy={y} r="14" fill="#312E81" stroke="#818CF8" strokeWidth="2" />
                <text x={x} y={y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  H
                </text>
                <text x={x} y={y + 24} textAnchor="middle" fill="#A5B4FC" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {hosp.name.split(' ')[0]} ({hosp.available_beds} beds)
                </text>
              </g>
            );
          })}

          {/* IoT Sensors */}
          {showSensors && sensors.map(sensor => {
            const { x, y } = project(sensor.location.lat, sensor.location.lng);
            const isCritical = sensor.status === 'CRITICAL';
            const sensorColor = isCritical ? '#FF1744' : sensor.status === 'WARNING' ? '#FFB020' : '#00E676';

            return (
              <g
                key={`sensor-${sensor.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({ type: 'sensor', data: sensor, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx={x} cy={y} r="5" fill={sensorColor} />
                <text x={x + 8} y={y + 3} fill="#94A3B8" fontSize="8" fontFamily="monospace">
                  {sensor.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Responder Units */}
          {showUnits && units.map(unit => {
            const { x, y } = project(unit.location.lat, unit.location.lng);
            const isDispatched = unit.status === 'EN_ROUTE' || unit.status === 'DISPATCHED';

            return (
              <g
                key={`unit-${unit.id}`}
                className="cursor-pointer"
                onClick={() => onSelectUnit && onSelectUnit(unit)}
                onMouseEnter={() => setHoveredNode({ type: 'unit', data: unit, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {isDispatched && (
                  <circle cx={x} cy={y} r="16" fill="none" stroke="#00E5FF" strokeWidth="1.5" className="animate-ping" />
                )}
                <rect
                  x={x - 8}
                  y={y - 8}
                  width="16"
                  height="16"
                  rx="4"
                  fill={isDispatched ? '#00E5FF' : '#1E293B'}
                  stroke={isDispatched ? '#FFFFFF' : '#00E5FF'}
                  strokeWidth="1.5"
                />
                <text x={x} y={y + 3.5} textAnchor="middle" fill={isDispatched ? '#0B0F17' : '#00E5FF'} fontSize="8" fontWeight="bold">
                  {unit.callsign.charAt(0)}
                </text>
                <text x={x} y={y + 18} textAnchor="middle" fill="#E2E8F0" fontSize="8" fontFamily="monospace">
                  {unit.callsign.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Incidents */}
          {incidents.map(inc => {
            const { x, y } = project(inc.coordinates.lat, inc.coordinates.lng);
            const isSelected = selectedIncident?.id === inc.id;
            const isResolved = inc.status === 'RESOLVED';
            const priorityColor = isResolved ? '#64748B' : getPriorityColor(inc.priority);

            return (
              <g
                key={`incident-${inc.id}`}
                className="cursor-pointer"
                onClick={() => onSelectIncident(inc)}
                onMouseEnter={() => setHoveredNode({ type: 'incident', data: inc, x, y })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {!isResolved && inc.priority === 'P1' && (
                  <circle cx={x} cy={y} r="22" fill="none" stroke={priorityColor} strokeWidth="2" className="animate-ping" opacity={0.7} />
                )}
                <polygon
                  points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`}
                  fill={priorityColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                />
                <text x={x} y={y + 3.5} textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                  {inc.priority}
                </text>
                <g transform={`translate(${x + 14}, ${y - 8})`}>
                  <rect x="0" y="0" width={inc.title.length * 5.6 + 12} height="16" rx="3" fill="rgba(11, 15, 23, 0.85)" stroke={priorityColor} strokeWidth="1" />
                  <text x="5" y="11" fill="#F8FAFC" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {inc.title.slice(0, 22)}{inc.title.length > 22 ? '...' : ''}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 border border-cyan-500/50 p-2.5 rounded-lg shadow-xl text-xs font-mono max-w-xs"
            style={{
              left: Math.min(hoveredNode.x + 20, 700),
              top: Math.min(hoveredNode.y - 10, 500)
            }}
          >
            {hoveredNode.type === 'hospital' && (
              <div>
                <p className="font-bold text-indigo-400">{hoveredNode.data.name}</p>
                <p className="text-[11px] text-slate-300">{hoveredNode.data.trauma_level}</p>
                <div className="flex items-center justify-between text-[10px] text-emerald-400 mt-1">
                  <span>Available Beds: {hoveredNode.data.available_beds}</span>
                  <span>ICU: {hoveredNode.data.icu_capacity}</span>
                </div>
              </div>
            )}
            {hoveredNode.type === 'signal' && (
              <div>
                <p className="font-bold text-white">{hoveredNode.data.intersection_name}</p>
                <p className="text-[11px] mt-0.5">
                  State: <span className={`font-bold ${hoveredNode.data.is_overridden ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredNode.data.is_overridden ? '🟢 100% GREEN (OVERRIDE)' : '🔴 RED (NORMAL)'}
                  </span>
                </p>
                {hoveredNode.data.distance_to_active_ambulance_km && (
                  <p className="text-[10px] text-cyan-300 mt-1">
                    Approaching Ambulance: {hoveredNode.data.distance_to_active_ambulance_km} km
                  </p>
                )}
              </div>
            )}
            {hoveredNode.type === 'incident' && (
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="px-1 rounded bg-rose-500 text-[10px]">{hoveredNode.data.priority}</span>
                  <span>{hoveredNode.data.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{hoveredNode.data.raw_description}</p>
              </div>
            )}
            {hoveredNode.type === 'unit' && (
              <div>
                <p className="font-bold text-cyan-400">{hoveredNode.data.callsign}</p>
                <p className="text-slate-300 text-[11px]">{hoveredNode.data.type}</p>
              </div>
            )}
            {hoveredNode.type === 'sensor' && (
              <div>
                <p className="font-bold text-emerald-400">{hoveredNode.data.name}</p>
                <p className="text-white text-[11px]">{hoveredNode.data.value} {hoveredNode.data.unit}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Emergency Crisis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
            <span>Ambulance / Unit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Preempted Traffic Signal (&lt; 1 km)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Trauma Center Hospital</span>
          </div>
        </div>
        <div className="text-emerald-400 text-[10px] font-bold">
          🟢 Dynamic Green Corridor AI Active
        </div>
      </div>
    </div>
  );
};
