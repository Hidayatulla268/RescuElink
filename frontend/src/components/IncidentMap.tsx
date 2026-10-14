import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Incident, ResponderUnit, IoTSensor, PriorityLevel,
  Hospital, TrafficSignal, GreenCorridorTransitSession,
  RoadSegment, HospitalRouteOption
} from '../types';
import { 
  AlertTriangle, Radio, ZoomIn, ZoomOut, RotateCcw, Crosshair, Building2,
  Zap, Compass, Activity, Truck, Satellite, Layers, Globe,
  ShieldCheck, Maximize2, Minimize2, Navigation, ExternalLink,
  Flame, CheckCircle2
} from 'lucide-react';
import { DriverNavigationMap } from './DriverNavigationMap';

interface IncidentMapProps {
  incidents: Incident[];
  units: ResponderUnit[];
  sensors: IoTSensor[];
  hospitals?: Hospital[];
  trafficSignals?: TrafficSignal[];
  activeCorridor?: GreenCorridorTransitSession | null;
  selectedRoute?: HospitalRouteOption | null;
  trafficRoads?: RoadSegment[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onSelectUnit?: (unit: ResponderUnit) => void;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  units,
  sensors: _sensors,
  hospitals = [],
  trafficSignals = [],
  activeCorridor = null,
  selectedRoute = null,
  trafficRoads = [],
  selectedIncident,
  onSelectIncident,
  onSelectUnit
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for dynamic data
  const incidentsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const unitsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const hospitalsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const signalsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const trafficLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routesLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Map state
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite' | 'streets'>('tactical');
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showUnits, setShowUnits] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [showRouteLayer, setShowRouteLayer] = useState<boolean>(true);
  const [radarSweepEnabled, setRadarSweepEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDriverNavMode, setIsDriverNavMode] = useState<boolean>(false);

  // Fallback / Recommended Route for Driver Google Navigation if selectedRoute is not chosen yet
  const activeNavRoute: HospitalRouteOption = useMemo(() => {
    if (selectedRoute) return selectedRoute;

    const defaultHosp = hospitals[0] || {
      id: 'hosp-apollo',
      name: 'Apollo Hospital Bannerghatta',
      address: 'Bannerghatta Main Rd, Krishnaraju Layout',
      trauma_level: 'Level 1 Trauma',
      available_icu_beds: 6,
      coordinates: { lat: 12.8938, lng: 77.5976 }
    };

    const start = selectedIncident?.coordinates || { lat: 12.9345, lng: 77.6200 };
    return {
      route_id: 'route-nav-default',
      hospital_id: defaultHosp.id,
      route_name: 'Fastest Route: Hosur Expressway ➔ Apollo Emergency Center',
      route_type: 'AI_SHORTEST_PREEMPTED',
      distance_km: 7.2,
      estimated_minutes_normal: 24,
      estimated_minutes_preempted: 8,
      time_saved_minutes: 16,
      traffic_delay_minutes: 1,
      congestion_score_pct: 18,
      traffic_free_pct: 85,
      signals_preempted_count: 5,
      via_roads: ['Hosur Rd NH-44 Elevated', 'Dairy Circle Flyover', 'Bannerghatta Link'],
      waypoints: [
        start,
        { lat: 12.9300, lng: 77.6150 },
        { lat: 12.9210, lng: 77.6080 },
        { lat: 12.9100, lng: 77.6020 },
        { lat: 12.8938, lng: 77.5976 }
      ]
    };
  }, [selectedRoute, hospitals, selectedIncident]);

  const activeNavHospital: Hospital = useMemo(() => {
    if (selectedRoute) {
      const found = hospitals.find(h => h.id === selectedRoute.hospital_id);
      if (found) return found;
    }
    return hospitals[0] || {
      id: 'hosp-apollo',
      name: 'Apollo Hospital Bannerghatta',
      address: 'Bannerghatta Main Rd, Krishnaraju Layout',
      trauma_level: 'Level 1 Trauma',
      available_icu_beds: 6,
      coordinates: { lat: 12.8938, lng: 77.5976 }
    };
  }, [selectedRoute, hospitals]);

  // Bengaluru Metropolitan Center
  const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

  // Helper for Priority Colors
  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'P1': return '#FF1744';
      case 'P2': return '#FF9100';
      case 'P3': return '#FFD600';
      case 'P4': return '#00E5FF';
      default: return '#00E5FF';
    }
  };

  // 1. Initialize Leaflet Map Instance Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BENGALURU_CENTER,
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Add layer groups
    incidentsLayerRef.current.addTo(map);
    unitsLayerRef.current.addTo(map);
    hospitalsLayerRef.current.addTo(map);
    signalsLayerRef.current.addTo(map);
    trafficLayerRef.current.addTo(map);
    routesLayerRef.current.addTo(map);

    // Track zoom and mousemove
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5))
      });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Tile Layer Manager (Tactical Night vs High-Res Satellite vs Urban Streets)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    if (mapStyle === 'satellite') {
      // Esri High-Resolution World Imagery
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      // World Boundaries and Places overlay for satellite
      labelLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.85 }
      ).addTo(map);

    } else if (mapStyle === 'streets') {
      // Carto Voyager Street Vector View
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);

    } else {
      // Tactical Dark Matter (Gold standard for Military/Emergency Operations Centers)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);
    }
  }, [mapStyle]);

  // Invalidate map size on fullscreen or container resize
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // 3. Render Emergency Incidents Layer
  useEffect(() => {
    const group = incidentsLayerRef.current;
    group.clearLayers();

    if (!showIncidents) return;

    incidents.forEach(inc => {
      const isSelected = selectedIncident?.id === inc.id;
      const isResolved = inc.status === 'RESOLVED';
      const color = isResolved ? '#64748B' : getPriorityColor(inc.priority);
      const isP1 = inc.priority === 'P1' && !isResolved;

      // Draw evacuation danger radius circle
      if (!isResolved && inc.triage?.evacuation_radius_meters) {
        const circle = L.circle([inc.coordinates.lat, inc.coordinates.lng], {
          radius: inc.triage.evacuation_radius_meters,
          color: color,
          weight: 1.5,
          dashArray: '6, 6',
          fillColor: inc.category === 'FLOOD_WATER' ? '#0284c7' : color,
          fillOpacity: 0.12
        });
        group.addLayer(circle);
      }

      // Custom HTML Marker Icon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 48px; height: 48px;">
          ${isP1 ? `<div class="absolute w-12 h-12 rounded-full border-2 border-rose-500 radar-ping"></div>` : ''}
          ${isSelected ? `<div class="absolute w-10 h-10 rounded-full border border-cyan-400 animate-ping"></div>` : ''}
          
          <div class="relative flex items-center justify-center w-8 h-8 rotate-45 rounded-md shadow-2xl transition-all duration-300 transform group-hover:scale-125"
               style="background-color: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 0 16px ${color}99;">
            <span class="-rotate-45 font-mono text-[11px] font-extrabold text-white leading-none">
              ${inc.priority}
            </span>
          </div>

          <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/95 border border-white/20 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-lg pointer-events-none opacity-90 group-hover:opacity-100 group-hover:scale-110 transition">
            ${inc.title.slice(0, 18)}${inc.title.length > 18 ? '...' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'incident-marker-icon',
        html: iconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: customIcon });

      // Interactive Popup
      const victims = inc.triage?.estimated_victims || 0;
      const severity = inc.triage?.severity_score || 70;
      const popupHtml = `
        <div style="font-family: ui-monospace, monospace; width: 280px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background-color: ${color}; color: #ffffff; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 6px;">
              🚨 ${inc.priority} CRISIS
            </span>
            <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">
              ${inc.category.replace('_', ' ')}
            </span>
          </div>
          
          <div style="font-size: 13px; font-weight: bold; color: #ffffff; margin-bottom: 4px; line-height: 1.2;">
            ${inc.title}
          </div>
          
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 ${inc.location_address}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; margin-bottom: 8px; font-size: 10px;">
            <div>
              <span style="color: #64748b;">CASUALTIES</span>
              <div style="color: #f43f5e; font-weight: bold; font-size: 12px;">~${victims} Injured</div>
            </div>
            <div>
              <span style="color: #64748b;">SEVERITY SCORE</span>
              <div style="color: #38bdf8; font-weight: bold; font-size: 12px;">${severity}/100</div>
            </div>
          </div>

          <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.3;">
            ${inc.raw_description.slice(0, 110)}${inc.raw_description.length > 110 ? '...' : ''}
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="inspect-inc-${inc.id}" style="flex: 1; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; border: none; padding: 6px 10px; border-radius: 8px; font-weight: bold; font-size: 11px; cursor: pointer;">
              🔍 Inspect Crisis
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${inc.coordinates.lat},${inc.coordinates.lng}" target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.1); color: #38bdf8; border: 1px solid rgba(255,255,255,0.15); padding: 6px 8px; border-radius: 8px; font-size: 11px; text-decoration: none; display: flex; align-items: center; justify-content: center;">
              ↗ GPS
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-inc-${inc.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectIncident(inc);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectIncident(inc);
      });

      group.addLayer(marker);
    });
  }, [incidents, selectedIncident, showIncidents, onSelectIncident]);

  // 4. Render Responders Units Layer (Ambulances, Fire, Police)
  useEffect(() => {
    const group = unitsLayerRef.current;
    group.clearLayers();

    if (!showUnits) return;

    units.forEach(unit => {
      const isEnRoute = unit.status === 'EN_ROUTE' || unit.status === 'DISPATCHED';
      const isAmb = unit.callsign.includes('108') || unit.callsign.includes('AMB');
      const isFire = unit.callsign.includes('FIRE') || unit.callsign.includes('SDRF');
      const isPolice = unit.callsign.includes('POLICE');

      const emoji = isAmb ? '🚑' : isFire ? '🚒' : isPolice ? '🚓' : '🛸';
      const glowColor = isAmb ? '#00E5FF' : isFire ? '#F97316' : '#818CF8';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 44px; height: 44px;">
          ${isEnRoute ? `<div class="absolute w-10 h-10 rounded-full border-2 border-cyan-400 radar-ping"></div>` : ''}

          <div class="relative flex items-center justify-center w-8 h-8 rounded-xl shadow-xl transition-all duration-300 transform group-hover:scale-125"
               style="background: ${isEnRoute ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#1e293b'}; border: 2px solid #ffffff; box-shadow: 0 0 14px ${glowColor}80;">
            <span class="text-sm leading-none">${emoji}</span>
          </div>

          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-950/90 border border-cyan-500/30 text-[8px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow pointer-events-none">
            ${unit.callsign.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'unit-marker-icon',
        html: iconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([unit.location.lat, unit.location.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: ui-monospace, monospace; width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 16px;">${emoji}</span>
            <div>
              <div style="font-size: 12px; font-weight: bold; color: #ffffff;">${unit.callsign}</div>
              <div style="font-size: 9px; color: #38bdf8; text-transform: uppercase;">${unit.type} UNIT</div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; background: rgba(255,255,255,0.06); padding: 6px 8px; border-radius: 6px; margin-bottom: 6px;">
            <span style="color: #94a3b8;">Status:</span>
            <span style="font-weight: bold; color: ${isEnRoute ? '#00e676' : '#cbd5e1'};">${unit.status}</span>
          </div>

          <div style="font-size: 9px; color: #94a3b8; margin-bottom: 8px;">
            Coordinates: ${unit.location.lat.toFixed(4)}° N, ${unit.location.lng.toFixed(4)}° E
          </div>

          ${onSelectUnit ? `
            <button id="select-unit-${unit.id}" style="width: 100%; background: #0284c7; color: #ffffff; border: none; padding: 6px; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer;">
              Select & Dispatch Unit
            </button>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`select-unit-${unit.id}`);
        if (btn && onSelectUnit) {
          btn.onclick = () => {
            onSelectUnit(unit);
            marker.closePopup();
          };
        }
      });

      group.addLayer(marker);
    });
  }, [units, showUnits, onSelectUnit]);

  // 5. Render Trauma Hospitals Layer (Apollo, Manipal, Victoria, Fortis)
  useEffect(() => {
    const group = hospitalsLayerRef.current;
    group.clearLayers();

    if (!showHospitals) return;

    hospitals.forEach(hosp => {
      const isApollo = hosp.name.toLowerCase().includes('apollo');
      const isManipal = hosp.name.toLowerCase().includes('manipal');

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 52px; height: 52px;">
          <div class="absolute w-12 h-12 rounded-full bg-indigo-500/20 blur-sm"></div>

          <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl shadow-2xl transition-all duration-300 transform group-hover:scale-125"
               style="background: linear-gradient(135deg, #3730a3, #1e1b4b); border: 2px solid #818cf8; box-shadow: 0 0 16px rgba(99, 102, 241, 0.7);">
            <div class="relative w-4 h-4 flex items-center justify-center">
              <span class="absolute w-1 h-4 bg-white rounded-full"></span>
              <span class="absolute w-4 h-1 bg-white rounded-full"></span>
            </div>
          </div>

          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/95 border border-indigo-500/40 text-[9px] font-mono font-bold text-indigo-200 whitespace-nowrap shadow-xl pointer-events-none">
            🏥 ${hosp.name.split(' ')[0]} (${hosp.available_trauma_bays} Bays)
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'hospital-marker-icon',
        html: iconHtml,
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      const marker = L.marker([hosp.coordinates.lat, hosp.coordinates.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: ui-monospace, monospace; width: 280px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px;">
              🏥 EMERGENCY TRAUMA
            </span>
            <span style="color: #38bdf8; font-size: 10px; font-weight: bold;">
              ${hosp.trauma_level}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: bold; color: #ffffff; margin-bottom: 4px;">
            ${hosp.name}
          </div>

          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
            📍 ${hosp.address}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; margin-bottom: 10px; font-size: 10px;">
            <div>
              <span style="color: #64748b;">TRAUMA BAYS</span>
              <div style="color: #34d399; font-weight: bold; font-size: 13px;">${hosp.available_trauma_bays} / ${hosp.total_trauma_bays} Free</div>
            </div>
            <div>
              <span style="color: #64748b;">ICU CRITICAL</span>
              <div style="color: #38bdf8; font-weight: bold; font-size: 13px;">${hosp.icu_beds_free} Available</div>
            </div>
          </div>

          <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 10px;">
            ⚡ Direct Resuscitation Bays on Standby: <strong>${hosp.available_trauma_bays >= 2 ? 'ACTIVE' : 'LIMITED'}</strong>
          </div>

          <a href="https://www.google.com/maps/dir/?api=1&destination=${hosp.coordinates.lat},${hosp.coordinates.lng}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff; padding: 7px; border-radius: 8px; font-weight: bold; font-size: 11px; text-decoration: none;">
            ↗ Open Google Maps GPS Route
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });
      group.addLayer(marker);
    });
  }, [hospitals, showHospitals]);

  // 6. Render Smart Traffic Signals Layer
  useEffect(() => {
    const group = signalsLayerRef.current;
    group.clearLayers();

    if (!showSignals) return;

    trafficSignals.forEach(sig => {
      const isGreen = sig.state === 'EMERGENCY_OVERRIDE' || sig.is_overridden;
      const color = isGreen ? '#00E676' : '#FF1744';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 38px; height: 38px;">
          ${isGreen ? `<div class="absolute w-8 h-8 rounded-full border-2 border-emerald-400 radar-ping"></div>` : ''}

          <div class="relative flex flex-col items-center justify-center w-5 h-9 rounded-md shadow-lg transition-transform group-hover:scale-125"
               style="background-color: #0B1322; border: 1.5px solid ${color};">
            <span class="w-2.5 h-2.5 rounded-full mb-0.5" style="background-color: ${isGreen ? '#334155' : '#FF1744'};"></span>
            <span class="w-2.5 h-2.5 rounded-full mb-0.5 bg-slate-700"></span>
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${isGreen ? '#00E676' : '#334155'}; ${isGreen ? 'box-shadow: 0 0 8px #00E676;' : ''}"></span>
          </div>

          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-950/90 text-[8px] font-mono font-bold whitespace-nowrap"
               style="color: ${color}; border: 1px solid ${color}40;">
            ${isGreen ? '🟢 GREEN PREEMPT' : '🔴 RED CROSS'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'signal-marker-icon',
        html: iconHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([sig.coordinates.lat, sig.coordinates.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: ui-monospace, monospace; width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: bold; color: #ffffff;">🚦 SMART TRAFFIC NODE</span>
            <span style="font-size: 9px; font-weight: bold; color: ${isGreen ? '#00e676' : '#f43f5e'};">
              ${isGreen ? '100% PREEMPTED' : 'NORMAL'}
            </span>
          </div>

          <div style="font-size: 12px; font-weight: bold; color: #38bdf8; margin-bottom: 4px;">
            ${sig.intersection_name}
          </div>

          <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px;">
            Status: <strong style="color: ${isGreen ? '#00e676' : '#f43f5e'};">${isGreen ? '🟢 Emergency Corridor Green Overridden' : '🔴 Regular Cross-Traffic Timing'}</strong>
          </div>

          ${sig.distance_to_active_ambulance_km ? `
            <div style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2); padding: 6px 8px; border-radius: 6px; font-size: 10px; color: #38bdf8;">
              Approaching 108 Ambulance: <strong>${sig.distance_to_active_ambulance_km} km away</strong>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      group.addLayer(marker);
    });
  }, [trafficSignals, showSignals]);

  // 7. Render Live Metropolitan Traffic & Traffic-Free Expressways Layer
  useEffect(() => {
    const group = trafficLayerRef.current;
    group.clearLayers();

    if (!showTrafficLayer) return;

    trafficRoads.forEach(road => {
      const isFree = road.is_traffic_free;
      const isGridlock = road.congestion_level === 'HEAVY_GRIDLOCK';

      const color = isFree ? '#00E676' : isGridlock ? '#FF1744' : '#F59E0B';
      const weight = isFree ? 6 : 4;
      const points: [number, number][] = [
        [road.coordinates_start.lat, road.coordinates_start.lng],
        [road.coordinates_end.lat, road.coordinates_end.lng]
      ];

      // Broad outer glow ribbon
      const glowPolyline = L.polyline(points, {
        color: color,
        weight: isFree ? 12 : 8,
        opacity: isFree ? 0.35 : 0.25,
        lineCap: 'round'
      });

      // Core path line
      const corePolyline = L.polyline(points, {
        color: color,
        weight: weight,
        opacity: 0.9,
        lineCap: 'round'
      });

      // Moving animated dash line for free flow or gridlock
      const dashPolyline = L.polyline(points, {
        color: '#FFFFFF',
        weight: 2,
        dashArray: isFree ? '12, 10' : '4, 8',
        opacity: 0.75
      });

      // Interactive Popup for Road
      const popupHtml = `
        <div style="font-family: ui-monospace, monospace; width: 260px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${isFree ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)'}; color: ${color}; border: 1px solid ${color}60; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px;">
              ${isFree ? '🟢 TRAFFIC-FREE EXPRESSWAY' : isGridlock ? '🔴 GRIDLOCK BOTTLENECK' : '🟡 MODERATE TRAFFIC'}
            </span>
            <span style="color: #ffffff; font-size: 11px; font-weight: bold;">
              ${road.current_speed_kmh} km/h
            </span>
          </div>

          <div style="font-size: 13px; font-weight: bold; color: #ffffff; margin-bottom: 4px;">
            ${road.name}
          </div>

          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
            Corridor Type: <strong style="color: #cbd5e1;">${road.corridor_type}</strong>
          </div>

          <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.3;">
            ${road.description}
          </div>

          <div style="background: rgba(255,255,255,0.06); padding: 6px 8px; border-radius: 6px; font-size: 10px; color: ${isFree ? '#34d399' : '#f87171'};">
            ${isFree ? `✓ Recommended for Emergency Transit (0-2 min signal delay)` : `⚠️ Delay: +${road.delay_minutes} min (Avoid for spinal trauma)`}
          </div>
        </div>
      `;

      corePolyline.bindPopup(popupHtml, { maxWidth: 280 });

      group.addLayer(glowPolyline);
      group.addLayer(corePolyline);
      group.addLayer(dashPolyline);
    });
  }, [trafficRoads, showTrafficLayer]);

  // 8. Render Driver-Selected Route & Green Corridor Transit Polyline
  useEffect(() => {
    const group = routesLayerRef.current;
    group.clearLayers();

    if (!showRouteLayer) return;

    // A. If Driver has a Selected Route (e.g. Route A, Route B, Route C)
    if (selectedRoute && selectedRoute.waypoints.length >= 2) {
      const latlngs: [number, number][] = selectedRoute.waypoints.map(w => [w.lat, w.lng]);
      const isBypass = selectedRoute.route_type === 'TRAFFIC_FREE_BYPASS';
      const color = isBypass ? '#38BDF8' : '#00E676';

      // Broad neon corridor glow
      const glowPoly = L.polyline(latlngs, {
        color: color,
        weight: 16,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Core ribbon
      const corePoly = L.polyline(latlngs, {
        color: color,
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Animated directional flow
      const dashPoly = L.polyline(latlngs, {
        color: '#FFFFFF',
        weight: 2.5,
        dashArray: '12, 8',
        opacity: 0.9
      });

      // Pickup point marker (Start)
      const startPoint = latlngs[0];
      const startIcon = L.divIcon({
        className: 'route-start-icon',
        html: `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border-2 border-rose-500 text-[10px] font-mono font-bold text-white shadow-2xl">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>🚨 PATIENT PICKUP</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });
      const startMarker = L.marker(startPoint, { icon: startIcon });

      // Destination ER marker (End)
      const endPoint = latlngs[latlngs.length - 1];
      const endIcon = L.divIcon({
        className: 'route-end-icon',
        html: `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border-2 border-emerald-400 text-[10px] font-mono font-bold text-emerald-300 shadow-2xl">
            <span>🏥 ER TRAUMA BAY</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });
      const endMarker = L.marker(endPoint, { icon: endIcon });

      group.addLayer(glowPoly);
      group.addLayer(corePoly);
      group.addLayer(dashPoly);
      group.addLayer(startMarker);
      group.addLayer(endMarker);
    } 
    // B. Or if Active Green Corridor Transit Session is in progress
    else if (activeCorridor && activeCorridor.corridor_waypoints.length >= 2) {
      const latlngs: [number, number][] = activeCorridor.corridor_waypoints.map(w => [w.lat, w.lng]);

      const glowPoly = L.polyline(latlngs, {
        color: '#00E676',
        weight: 16,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const corePoly = L.polyline(latlngs, {
        color: '#00E676',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const dashPoly = L.polyline(latlngs, {
        color: '#FFFFFF',
        weight: 2.5,
        dashArray: '12, 8',
        opacity: 0.9
      });

      group.addLayer(glowPoly);
      group.addLayer(corePoly);
      group.addLayer(dashPoly);
    }
  }, [selectedRoute, activeCorridor, showRouteLayer]);

  // Quick Focus Helpers
  const handleFocusP1Crisis = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const p1 = incidents.find(i => i.priority === 'P1' && i.status !== 'RESOLVED') || incidents[0];
    if (p1) {
      onSelectIncident(p1);
      map.flyTo([p1.coordinates.lat, p1.coordinates.lng], 15, { duration: 1.2 });
    }
  };

  const handleFocusCorridor = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedRoute && selectedRoute.waypoints.length > 0) {
      const bounds = L.latLngBounds(selectedRoute.waypoints.map(w => [w.lat, w.lng]));
      map.fitBounds(bounds, { padding: [60, 60], duration: 1.2 });
    } else if (activeCorridor && activeCorridor.corridor_waypoints.length > 0) {
      const bounds = L.latLngBounds(activeCorridor.corridor_waypoints.map(w => [w.lat, w.lng]));
      map.fitBounds(bounds, { padding: [60, 60], duration: 1.2 });
    } else {
      map.flyTo(BENGALURU_CENTER, 13, { duration: 1.2 });
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(BENGALURU_CENTER, 12, { duration: 1.2 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const activeCrisisCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const preemptedCount = trafficSignals.filter(s => s.state === 'EMERGENCY_OVERRIDE' || s.is_overridden).length;

  // 1. If Driver Turn-by-Turn GPS Navigation Mode is Activated
  if (isDriverNavMode) {
    return (
      <div className={`relative w-full transition-all duration-300 bg-[#050B14] rounded-3xl border border-white/15 overflow-hidden shadow-2xl flex flex-col font-sans select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : 'h-full min-h-[580px]'
      }`}>
        <DriverNavigationMap
          route={activeNavRoute}
          hospital={activeNavHospital}
          pickupAddress={selectedIncident?.location_address || 'Koramangala 5th Block Junction, Bengaluru'}
          pickupCoords={selectedIncident?.coordinates || { lat: 12.9345, lng: 77.6200 }}
          ambulanceCallsign={units.find(u => u.type === 'AMBULANCE')?.callsign || 'AMB-108-CRITICAL'}
          trafficSignals={trafficSignals}
          trafficRoads={trafficRoads}
          onExitNavigation={() => setIsDriverNavMode(false)}
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full transition-all duration-300 bg-[#050B14] rounded-3xl border border-white/15 overflow-hidden shadow-2xl flex flex-col font-sans select-none ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : 'h-full min-h-[580px]'
    }`}>

      {/* TOP FLOATING HUD & RADAR CONTROL BAR */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">

        {/* Tactical Station Header Badge */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl glass-card-ultra border border-cyan-500/30 text-xs font-mono shadow-neon-blue">
          <div className="relative flex items-center justify-center w-6 h-6">
            <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">
                🇮🇳 BENGALURU URBAN GIS RADAR
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                112 / 108 LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {activeCrisisCount} Crises Reported • {preemptedCount} Signals Preempted
            </p>
          </div>
        </div>

        {/* View Mode Switcher: Dark Tactical vs Satellite Recon vs Street Vector */}
        <div className="pointer-events-auto flex items-center p-1 rounded-2xl glass-card-ultra border border-white/20 text-xs font-mono shadow-lg">
          <button
            onClick={() => setMapStyle('tactical')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              mapStyle === 'tactical'
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-400/50 shadow-neon-blue font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Dark Tactical Mode (CartoDB Dark Matter for Emergency Centers)"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>🗺️ Tactical Dark</span>
          </button>

          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              mapStyle === 'satellite'
                ? 'bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-emerald-200 border border-emerald-400/50 shadow-neon-green font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Satellite Recon (High-Resolution Earth Imagery)"
          >
            <Satellite className="w-4 h-4 text-emerald-400" />
            <span>🛰️ Satellite Recon</span>
          </button>

          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              mapStyle === 'streets'
                ? 'bg-gradient-to-r from-amber-500/30 to-orange-600/30 text-amber-200 border border-amber-400/50 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Urban Street Vector Navigation"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>🧭 Street Vector</span>
          </button>
        </div>

        {/* Quick Focus Actions, Driver Nav & Traffic Toggle */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-card-ultra border border-white/15 text-xs font-mono">
          <button
            onClick={() => setIsDriverNavMode(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-200 border border-emerald-400/50 shadow-neon-green font-bold transition flex items-center gap-1.5 text-[11px] active:scale-95 animate-pulse"
            title="Switch to In-Cab Google Turn-by-Turn Navigation with bottom live telemetry"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-300" />
            <span>🚗 Driver GPS Nav (Google Style)</span>
          </button>

          <button
            onClick={handleFocusP1Crisis}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition flex items-center gap-1 text-[11px]"
            title="Fly Camera to Critical Incident"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Focus P1 Crisis</span>
          </button>

          <button
            onClick={handleFocusCorridor}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition flex items-center gap-1 text-[11px]"
            title="Fit Camera to Active Route / Green Corridor"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Focus Corridor</span>
          </button>

          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`px-2.5 py-1 rounded-xl border transition flex items-center gap-1 text-[11px] ${
              showTrafficLayer
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Toggle Live Metropolitan Traffic & Traffic-Free Corridors Layer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Traffic {showTrafficLayer ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Zoom & Fullscreen Controls */}
        <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-2xl glass-card-ultra border border-white/15 text-xs">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            title="Reset Map to Bengaluru Metro View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl hover:bg-white/10 text-cyan-300 hover:text-cyan-100 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Map View'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Layer Visibility Toggles (Bottom Left Floating Pill Bar) */}
      <div className="absolute top-16 right-3 z-30 pointer-events-auto flex flex-col gap-1.5 text-xs font-mono">
        <div className="flex flex-col gap-1 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl">
          <span className="text-[9px] text-slate-400 font-bold px-2 py-0.5 uppercase tracking-wider">
            Layer Controls
          </span>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-left flex items-center justify-between gap-3 transition ${
              showIncidents ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-1.5">🚨 Crises</span>
            <span>{showIncidents ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowUnits(!showUnits)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-left flex items-center justify-between gap-3 transition ${
              showUnits ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-1.5">🚑 Responders</span>
            <span>{showUnits ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowHospitals(!showHospitals)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-left flex items-center justify-between gap-3 transition ${
              showHospitals ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-1.5">🏥 Hospitals</span>
            <span>{showHospitals ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-left flex items-center justify-between gap-3 transition ${
              showSignals ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-1.5">🚦 Signals</span>
            <span>{showSignals ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowRouteLayer(!showRouteLayer)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-left flex items-center justify-between gap-3 transition ${
              showRouteLayer ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-1.5">🧭 Corridor</span>
            <span>{showRouteLayer ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* SATELLITE RECON HUD (When Satellite Mode Active) */}
      {mapStyle === 'satellite' && (
        <div className="absolute top-16 left-3 z-20 pointer-events-none flex flex-col gap-1 text-[10px] font-mono text-cyan-300/80 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white tracking-widest uppercase">ISRO CARTOSAT / EOS SATELLITE TELEMETRY</span>
          </div>
          <div className="text-[9px] text-slate-300 flex items-center gap-3">
            <span>RES: 0.25m/PX</span>
            <span>ALT: 505 KM LEO</span>
            <span>BAND: TRUE-COLOR VNIR</span>
            <span>ATMOS: CLEAR</span>
          </div>
        </div>
      )}

      {/* SELECTED ROUTE FLOATING OVERLAY CARD */}
      {selectedRoute && (
        <div className="absolute bottom-14 left-4 z-30 pointer-events-auto max-w-sm glass-card-ultra border border-cyan-400/50 p-3.5 rounded-2xl shadow-2xl text-xs font-mono animate-slide-up">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 text-[10px]">
                {selectedRoute.route_type.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400">
              ~{selectedRoute.estimated_minutes_preempted} MIN ETA
            </span>
          </div>

          <div className="text-white font-bold text-sm mb-1">
            {selectedRoute.route_name}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-white/5 p-2 rounded-xl my-2 text-[10px]">
            <div>
              <span className="text-slate-400">Distance</span>
              <div className="font-bold text-white text-xs">{selectedRoute.distance_km} km</div>
            </div>
            <div>
              <span className="text-slate-400">Congestion</span>
              <div className="font-bold text-emerald-400 text-xs">{selectedRoute.congestion_score_pct}%</div>
            </div>
            <div>
              <span className="text-slate-400">Preemption</span>
              <div className="font-bold text-cyan-300 text-xs">{selectedRoute.signals_preempted_count} Signals</div>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 mb-2">
            Via: {selectedRoute.via_roads.join(' ➔ ')}
          </p>

          <div className="flex items-center justify-between pt-1 text-[10px]">
            <button
              onClick={() => setIsDriverNavMode(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/50 font-bold transition flex items-center gap-1 shadow-neon-green"
              title="Launch Google Maps turn-by-turn navigation HUD"
            >
              <Navigation className="w-3 h-3 text-emerald-300" />
              <span>🚗 Start Google Nav</span>
            </button>

            <button
              onClick={handleFocusCorridor}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>Center Corridor</span>
            </button>
          </div>
        </div>
      )}

      {/* LEAFLET MAP CANVAS CONTAINER */}
      <div 
        ref={mapContainerRef} 
        className="flex-1 w-full h-full relative z-10"
        style={{ minHeight: '480px' }}
      />

      {/* MAP BOTTOM TELEMETRY & LEGEND FOOTER */}
      <div className="bg-slate-950/95 border-t border-white/10 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono z-20">
        
        {/* Real-World Coordinates & Zoom Level */}
        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {cursorCoords 
                ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E`
                : 'HOVER MAP FOR GPS COORDS'
              }
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <span>ZOOM:</span>
            <strong className="text-white">{currentZoom}x</strong>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-rose-500 inline-block shadow-neon-red" />
            <span className="text-slate-300">🚨 112 Crisis</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-300">🚑 108 Ambulance</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-400 shadow-neon-green inline-block" />
            <span className="text-emerald-300 font-bold">🟢 Free-Flow Expressway</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-rose-300">🔴 Traffic Gridlock</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
            <span className="text-indigo-200">🏥 Trauma Center</span>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LEAFLET GIS ONLINE
          </span>
        </div>

      </div>

    </div>
  );
};
