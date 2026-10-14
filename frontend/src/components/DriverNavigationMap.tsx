import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  HospitalRouteOption, Hospital, TrafficSignal, RoadSegment, Coordinates 
} from '../types';
import { 
  Navigation, MapPin, Truck, Building2, Zap, Clock, 
  ExternalLink, Compass, Play, Pause, RotateCcw, Volume2, 
  VolumeX, CheckCircle2, AlertTriangle, ArrowRight, CornerUpRight,
  CornerUpLeft, ArrowUp, Activity, ShieldCheck, Milestone
} from 'lucide-react';

interface DriverNavigationMapProps {
  route: HospitalRouteOption;
  hospital: Hospital;
  pickupAddress: string;
  pickupCoords: Coordinates;
  ambulanceCallsign?: string;
  trafficSignals?: TrafficSignal[];
  trafficRoads?: RoadSegment[];
  onExitNavigation?: () => void;
  onArrivedAtHospital?: () => void;
}

export const DriverNavigationMap: React.FC<DriverNavigationMapProps> = ({
  route,
  hospital,
  pickupAddress,
  pickupCoords,
  ambulanceCallsign = 'AMB-108-CRITICAL',
  trafficSignals = [],
  trafficRoads: _trafficRoads = [],
  onExitNavigation,
  onArrivedAtHospital
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const glowPolylineRef = useRef<L.Polyline | null>(null);

  // Simulation & Live Transit State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0.0 to 1.0
  const [speedKmh, setSpeedKmh] = useState<number>(68);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [hasAnnouncedSignal, setHasAnnouncedSignal] = useState<boolean>(false);
  const [hasAnnouncedArrival, setHasAnnouncedArrival] = useState<boolean>(false);

  // Audio Speech Announcer
  const speakInstruction = (text: string) => {
    if (!audioEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    }
  };

  // Interpolate Position along Route Waypoints
  const waypoints = route.waypoints && route.waypoints.length >= 2 
    ? route.waypoints 
    : [pickupCoords, hospital.coordinates];

  const getCurrentPosition = (p: number): { lat: number; lng: number; headingDeg: number } => {
    if (p <= 0) return { lat: waypoints[0].lat, lng: waypoints[0].lng, headingDeg: 45 };
    if (p >= 1) {
      const last = waypoints[waypoints.length - 1];
      const prev = waypoints[waypoints.length - 2] || last;
      const heading = (Math.atan2(last.lng - prev.lng, last.lat - prev.lat) * 180) / Math.PI;
      return { lat: last.lat, lng: last.lng, headingDeg: heading };
    }

    const totalSegments = waypoints.length - 1;
    const segmentIndex = Math.min(Math.floor(p * totalSegments), totalSegments - 1);
    const segmentProgress = (p * totalSegments) - segmentIndex;

    const p1 = waypoints[segmentIndex];
    const p2 = waypoints[segmentIndex + 1];

    const lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
    const lng = p1.lng + (p2.lng - p1.lng) * segmentProgress;

    // Calculate heading angle
    const headingDeg = (Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180) / Math.PI;

    return { lat, lng, headingDeg };
  };

  const currentCoords = getCurrentPosition(progress);

  // Dynamic Turn-by-Turn Instruction Calculation
  const getTurnInstruction = (p: number) => {
    if (p < 0.15) {
      return {
        icon: <ArrowUp className="w-7 h-7 text-white" />,
        main: "Head North towards Arterial Express Corridor",
        sub: `Depart from ${pickupAddress.slice(0, 32)} • Green Corridor Active`,
        distanceToTurn: "In 350 m"
      };
    } else if (p < 0.50) {
      const isBypass = route.route_type === 'TRAFFIC_FREE_BYPASS';
      return {
        icon: <CornerUpRight className="w-7 h-7 text-white" />,
        main: isBypass 
          ? "Slight Right onto Hosur Elevated Expressway (NH-44)" 
          : "Continue on Outer Ring Road Green Corridor",
        sub: isBypass ? "100% Traffic-Free Elevated Deck • Maintain 70+ km/h" : "Smart Traffic Preemption active on approaching signals",
        distanceToTurn: "In 800 m"
      };
    } else if (p < 0.85) {
      return {
        icon: <CornerUpLeft className="w-7 h-7 text-white" />,
        main: "Take Hospital Flyover Exit Ramp toward Emergency Care Gate",
        sub: `Next Signal Preempted to 100% Green • Bay 1 Sterile Standby`,
        distanceToTurn: "In 450 m"
      };
    } else {
      return {
        icon: <Building2 className="w-7 h-7 text-emerald-400" />,
        main: `Arrive at ${hospital.name.slice(0, 30)}`,
        sub: "Direct Ambulance Bay Access • Trauma Resuscitation Team Ready",
        distanceToTurn: "In 100 m"
      };
    }
  };

  const instruction = getTurnInstruction(progress);

  // Remaining Distance and ETA calculations
  const remainingDistKm = Math.max(0.1, Number((route.distance_km * (1 - progress)).toFixed(1)));
  const remainingMin = Math.max(0.5, Number((route.estimated_minutes_preempted * (1 - progress)).toFixed(1)));
  const totalSeconds = Math.round(remainingMin * 60);
  const displayMin = Math.floor(totalSeconds / 60);
  const displaySec = totalSeconds % 60;

  // Expected arrival clock time
  const arrivalTime = new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 1. Initialize Leaflet Navigation Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [pickupCoords.lat, pickupCoords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Matter Tactical Map Tiles (Crisp Google-Style Night Navigation)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const latlngs: [number, number][] = waypoints.map(w => [w.lat, w.lng]);

    // Outer broad neon corridor glow
    glowPolylineRef.current = L.polyline(latlngs, {
      color: '#00E676',
      weight: 16,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Inner bright navigation path (Google Maps Navigation Style)
    routePolylineRef.current = L.polyline(latlngs, {
      color: '#00E5FF',
      weight: 7,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Origin Marker (Pickup Site)
    const originIcon = L.divIcon({
      className: 'nav-origin-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 border-rose-500 shadow-2xl">
          <div class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([pickupCoords.lat, pickupCoords.lng], { icon: originIcon }).addTo(map);

    // Destination Marker (Hospital ER)
    const destIcon = L.divIcon({
      className: 'nav-dest-icon',
      html: `
        <div class="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-950 border-2 border-indigo-400 shadow-2xl">
          <span class="text-lg">🏥</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker([hospital.coordinates.lat, hospital.coordinates.lng], { icon: destIcon }).addTo(map);

    // Moving Vehicle Marker (Ambulance Puck)
    const vehicleIcon = L.divIcon({
      className: 'nav-vehicle-icon',
      html: `
        <div id="ambulance-nav-puck" class="relative flex items-center justify-center cursor-pointer" style="width: 52px; height: 52px;">
          <div class="absolute w-12 h-12 rounded-full border-2 border-cyan-400 radar-ping"></div>
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_20px_#00E5FF] transition-transform duration-300">
            <span class="text-xl">🚑</span>
          </div>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });

    vehicleMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);

    // Fit initial view
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [80, 80] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Drive the Animation Timer along Route
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          setIsPlaying(false);
          if (!hasAnnouncedArrival) {
            setHasAnnouncedArrival(true);
            speakInstruction(`Arrived at ${hospital.name} Emergency Reception. Trauma Bay ready for patient transfer.`);
            if (onArrivedAtHospital) onArrivedAtHospital();
          }
          return 1;
        }

        const next = Math.min(1, prev + 0.025);

        // Announce signal preemption at ~40% mark
        if (next > 0.4 && !hasAnnouncedSignal) {
          setHasAnnouncedSignal(true);
          speakInstruction("Traffic intersection cleared ahead. Smart signal switched to 100 percent emergency green.");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, hasAnnouncedSignal, hasAnnouncedArrival]);

  // 3. Update Vehicle Marker Position & Map Camera
  useEffect(() => {
    if (!vehicleMarkerRef.current) return;
    const { lat, lng } = currentCoords;

    vehicleMarkerRef.current.setLatLng([lat, lng]);

    if (isFollowMode && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [currentCoords.lat, currentCoords.lng, isFollowMode]);

  // Recenter / Follow Mode toggle
  const handleRecenter = () => {
    setIsFollowMode(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentCoords.lat, currentCoords.lng], 15, { animate: true });
    }
  };

  const handleResetJourney = () => {
    setProgress(0);
    setIsPlaying(true);
    setHasAnnouncedSignal(false);
    setHasAnnouncedArrival(false);
    if (mapInstanceRef.current) {
      const latlngs: [number, number][] = waypoints.map(w => [w.lat, w.lng]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [80, 80] });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] sm:min-h-[640px] bg-[#070B14] rounded-3xl border border-white/20 overflow-hidden shadow-2xl flex flex-col font-sans select-none">
      
      {/* 1. TOP GOOGLE MAPS NAVIGATION BANNER (Green Turn-By-Turn HUD) */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
        <div className="rounded-2xl bg-emerald-600/95 backdrop-blur-2xl border border-emerald-400/50 p-3 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-white flex items-center justify-between gap-3 sm:gap-4 animate-slide-down">
          
          <div className="flex items-center gap-4">
            {/* Big Maneuver Icon */}
            <div className="w-14 h-14 rounded-2xl bg-black/25 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              {instruction.icon}
            </div>

            {/* Instruction Text */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {instruction.distanceToTurn}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/20 font-mono font-bold text-emerald-200">
                  {route.route_type.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {instruction.main}
              </h3>
              <p className="text-xs text-emerald-100/90 line-clamp-1 font-mono">
                {instruction.sub}
              </p>
            </div>
          </div>

          {/* Quick Audio Mute & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-white transition border border-white/15"
              title={audioEnabled ? "Voice Navigation Active" : "Voice Navigation Muted"}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5 text-emerald-300" /> : <VolumeX className="w-5 h-5 text-slate-300" />}
            </button>

            {onExitNavigation && (
              <button
                onClick={onExitNavigation}
                className="px-3 py-2 rounded-xl bg-black/30 hover:bg-black/50 text-white font-mono text-xs font-bold transition border border-white/15"
              >
                Exit Nav
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Floating Speed & Follow Mode Quick Pill */}
      <div className="absolute top-28 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2">
        {/* Speedometer Badge */}
        <div className="px-3.5 py-2 rounded-2xl glass-card-ultra border border-cyan-400/50 text-center font-mono shadow-xl">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">SPEED</span>
          <span className="text-xl font-extrabold text-cyan-300">{speedKmh}</span>
          <span className="text-[9px] text-slate-400 block">KM/H</span>
        </div>

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="p-3 rounded-2xl glass-card-ultra border border-white/20 text-white hover:text-cyan-300 shadow-xl transition active:scale-95"
          title="Recenter on Ambulance"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* 2. LEAFLET MAP CANVAS */}
      <div 
        ref={mapContainerRef} 
        className="flex-1 w-full h-full relative z-10"
      />

      {/* 3. BOTTOM GOOGLE MAPS TRIP TELEMETRY DRAWER (Present Data from Website) */}
      <div className="relative z-30 bg-slate-950/95 backdrop-blur-2xl border-t border-white/15 p-4 sm:p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] font-mono text-slate-100">
        
        {/* Top Metric Row: Remaining ETA, Remaining Distance, Arrival Time */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">REMAINING TIME</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {displayMin}:{displaySec < 10 ? `0${displaySec}` : displaySec}
                </span>
                <span className="text-xs text-slate-400">min</span>
              </div>
            </div>

            <div className="border-l border-white/10 pl-4 sm:pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">DISTANCE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {remainingDistKm}
                </span>
                <span className="text-xs text-slate-400">km</span>
              </div>
            </div>

            <div className="hidden sm:block border-l border-white/10 pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">ARRIVAL CLOCK</span>
              <span className="text-lg font-bold text-cyan-300">
                {arrivalTime}
              </span>
            </div>

            <div className="hidden md:block border-l border-white/10 pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">TIME SAVED</span>
              <span className="text-lg font-bold text-amber-300">
                -{route.time_saved_minutes} min
              </span>
            </div>
          </div>

          {/* Simulation Controls: Play/Pause/Replay */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-2 rounded-xl glass-button-glow text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              <span>{isPlaying ? 'Pause Travel' : 'Resume Travel'}</span>
            </button>

            <button
              onClick={handleResetJourney}
              className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white transition"
              title="Restart Travel Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(`${hospital.name}, ${hospital.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-neon-blue transition active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open Native Google Maps</span>
              <span className="sm:hidden">Maps</span>
            </a>
          </div>

        </div>

        {/* Bottom Detailed Data: Hospital ER Reception, Smart Signals Preemption, Traffic Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
          
          {/* Destination Hospital Telemetry */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block">
                  DESTINATION TRAUMA CENTER
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {hospital.trauma_level || 'Level 1'}
                </span>
              </div>
              <h4 className="text-white font-bold text-xs truncate">
                {hospital.name}
              </h4>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Bay 1 Ready • {hospital.available_icu_beds || 6} ICU Beds Free</span>
              </p>
            </div>
          </div>

          {/* Smart Traffic Signal Ahead */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">
                  TRAFFIC PREEMPTION
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  🟢 100% GREEN
                </span>
              </div>
              <h4 className="text-white font-bold text-xs">
                {route.signals_preempted_count} Intersections Overridden
              </h4>
              <p className="text-[10px] text-slate-300 font-sans">
                Autonomous preemption active &lt; 1.0 km radius from 108 vehicle
              </p>
            </div>
          </div>

          {/* Road Segment & Driver Unit */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider block">
                  CORRIDOR &amp; FLEET
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 truncate max-w-[90px]">
                  {ambulanceCallsign}
                </span>
              </div>
              <h4 className="text-white font-bold text-xs truncate">
                {route.via_roads[0] || 'Express Corridor'}
              </h4>
              <p className="text-[10px] text-cyan-300 font-sans">
                {route.traffic_free_pct}% Free-Flowing Expressway • Speed: {speedKmh} km/h
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
