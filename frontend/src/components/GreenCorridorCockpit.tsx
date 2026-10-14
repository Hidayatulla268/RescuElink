import React, { useState, useEffect } from 'react';
import { 
  ResponderUnit, Hospital, TrafficSignal, GreenCorridorTransitSession,
  HospitalRouteOption, HospitalRecommendation, HospitalRoutingResponse, RoadSegment
} from '../types';
import { api } from '../services/api';
import { 
  Navigation, ShieldAlert, Radio, AlertTriangle, CheckCircle2, 
  MapPin, Clock, Truck, Building2, Flame, HeartPulse, Volume2, Sparkles, Zap, 
  ExternalLink, Compass, Check, ArrowRight, GitBranch, ThumbsUp, Milestone, 
  AlertCircle, ShieldCheck, Activity
} from 'lucide-react';
import { DriverNavigationMap } from './DriverNavigationMap';

interface GreenCorridorCockpitProps {
  units: ResponderUnit[];
  hospitals: Hospital[];
  trafficSignals: TrafficSignal[];
  onCorridorActivated?: (session: GreenCorridorTransitSession) => void;
  onSelectRouteForMap?: (route: HospitalRouteOption | null) => void;
}

export const GreenCorridorCockpit: React.FC<GreenCorridorCockpitProps> = ({
  units,
  hospitals,
  trafficSignals,
  onCorridorActivated,
  onSelectRouteForMap
}) => {
  const ambulances = units.filter(u => u.type === 'AMBULANCE_PARAMEDIC');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>(
    ambulances[0]?.id || 'unit-ems-101'
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitals[0]?.id || 'hosp-01'
  );
  const [pickupAddress, setPickupAddress] = useState<string>(
    'Silk Board Central Flyover Junction, Hosur Rd & ORR'
  );
  const [patientCondition, setPatientCondition] = useState<string>(
    'Acute Polytrauma / Traumatic Brain Injury with Hemodynamic Instability'
  );
  
  const [activeSession, setActiveSession] = useState<GreenCorridorTransitSession | null>(null);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [simulatedDistanceKm, setSimulatedDistanceKm] = useState<number>(2.4);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9180, lng: 77.6240 });
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(false);

  // New Routing, Route Selection & Traffic-Free Roads State
  const [routingData, setRoutingData] = useState<HospitalRoutingResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-green-corridor');
  const [acceptedRoute, setAcceptedRoute] = useState<HospitalRouteOption | null>(null);
  const [isComputingRoutes, setIsComputingRoutes] = useState<boolean>(false);
  const [isAcceptingRoute, setIsAcceptingRoute] = useState<boolean>(false);
  const [trafficRoads, setTrafficRoads] = useState<RoadSegment[]>([]);
  const [trafficRoadFilter, setTrafficRoadFilter] = useState<'all' | 'traffic_free' | 'congested'>('all');

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
  const selectedAmbulance = units.find(u => u.id === selectedAmbulanceId);

  // Load Routing and Live Traffic Road Conditions
  const fetchRoutingAndRoads = async () => {
    setIsComputingRoutes(true);
    try {
      const [routingRes, roadsRes] = await Promise.all([
        api.getHospitalRouting({
          pickup_address: pickupAddress,
          pickup_coordinates: pickupCoords,
          ambulance_id: selectedAmbulanceId,
          patient_condition: patientCondition
        }),
        api.getRoadsTraffic()
      ]);
      setRoutingData(routingRes);
      setTrafficRoads(roadsRes);
      
      // Auto-set the recommended route initially
      const currentHospRec = routingRes.all_hospitals.find(h => h.hospital.id === selectedHospitalId) || routingRes.nearest_hospital;
      const recommendedRoute = currentHospRec?.route_options.find(r => r.is_recommended) || currentHospRec?.route_options[0];
      if (recommendedRoute && !acceptedRoute) {
        setSelectedRouteId(recommendedRoute.route_id);
        if (onSelectRouteForMap) onSelectRouteForMap(recommendedRoute);
      }
    } catch (err) {
      console.warn('Failed to calculate hospital routing:', err);
    } finally {
      setIsComputingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutingAndRoads();
  }, [pickupCoords.lat, pickupCoords.lng, selectedHospitalId]);

  const detectLiveGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser/device.");
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) };
        setPickupCoords(coords);
        setPickupAddress(`Live GPS Coords (${coords.lat}, ${coords.lng})`);
        setGpsDetecting(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsDetecting(false);
        alert("Could not access live device GPS. Ensure location permissions are granted.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleReleaseCorridor = () => {
    if (confirm("Confirm: Patient handover complete at Trauma Center? This will release traffic signal locks back to municipal cycling.")) {
      setActiveSession(null);
      setAcceptedRoute(null);
      if (onSelectRouteForMap) onSelectRouteForMap(null);
      playAudioAlert("Green Corridor released. Normal traffic signals restored. Mission logged.");
    }
  };

  const playAudioAlert = (message: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    }
  };

  // Simulation timer to move ambulance closer and demonstrate the < 1.0 km green signal trigger!
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      setSimulatedDistanceKm(prev => {
        const next = Math.max(0.1, Number((prev - 0.25).toFixed(2)));
        if (prev > 1.0 && next <= 1.0) {
          playAudioAlert("Approaching junction within 1 kilometer. Traffic signal switched to 100 percent emergency green.");
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const handleStartCorridor = async () => {
    setIsActivating(true);
    try {
      const session = await api.startGreenCorridor({
        ambulance_id: selectedAmbulanceId,
        destination_hospital_id: selectedHospitalId,
        pickup_address: pickupAddress,
        pickup_coordinates: pickupCoords,
        patient_condition: patientCondition
      });
      setActiveSession(session);
      setSimulatedDistanceKm(2.4);
      playAudioAlert(`Green Corridor activated for ${selectedHospital?.name || 'Trauma Hospital'}. Traffic signals on route pre-empted to green.`);
      if (onCorridorActivated) onCorridorActivated(session);
    } catch (err) {
      alert(`Activation failed: ${err}`);
    } finally {
      setIsActivating(false);
    }
  };

  // Driver Route Acceptance Handler
  const handleDriverAcceptRoute = async (route: HospitalRouteOption) => {
    setIsAcceptingRoute(true);
    try {
      const targetHospId = selectedHospital?.id || routingData?.nearest_hospital.hospital.id || hospitals[0]?.id;
      const res = await api.driverAcceptRoute({
        ambulance_id: selectedAmbulanceId,
        destination_hospital_id: targetHospId,
        chosen_route_id: route.route_id,
        pickup_address: pickupAddress,
        pickup_coordinates: pickupCoords,
        patient_condition: patientCondition,
        driver_notes: `Accepted on in-cab terminal by driver: ${route.route_name}`
      });
      setSelectedRouteId(route.route_id);
      setAcceptedRoute(route);
      setActiveSession(res.session);
      setSimulatedDistanceKm(route.distance_km);
      if (onSelectRouteForMap) onSelectRouteForMap(route);
      playAudioAlert(`Route confirmed by driver: ${route.route_name}. Preempting ${res.signals_preempted} traffic intersections.`);
      if (onCorridorActivated) onCorridorActivated(res.session);
    } catch (err) {
      alert(`Failed to accept route: ${err}`);
    } finally {
      setIsAcceptingRoute(false);
    }
  };

  // Active hospital routing candidate
  const currentHospitalRec = routingData?.all_hospitals.find(h => h.hospital.id === selectedHospitalId) || routingData?.nearest_hospital;
  const nearestHospital = routingData?.nearest_hospital;
  const isSelectedNearest = nearestHospital && nearestHospital.hospital.id === selectedHospitalId;
  const targetHospital = selectedHospital || routingData?.nearest_hospital.hospital || hospitals[0];
  const activeRouteForNav = acceptedRoute || 
    currentHospitalRec?.route_options.find(r => r.route_id === selectedRouteId) || 
    currentHospitalRec?.route_options[0];
  const [showDriverNav, setShowDriverNav] = useState<boolean>(true);

  // Filtered traffic roads
  const filteredRoads = trafficRoads.filter(r => {
    if (trafficRoadFilter === 'traffic_free') return r.is_traffic_free;
    if (trafficRoadFilter === 'congested') return !r.is_traffic_free;
    return true;
  });

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 space-y-6 font-mono relative">
      {/* Subtle ambient lighting orbs for full glassy finish */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cockpit Banner Header */}
      <div className="p-6 rounded-3xl glass-card-ultra border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 shadow-neon-blue text-emerald-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold uppercase tracking-wider text-white">
                GreenCorridor AI™ — Shortest Path & Driver Route Cockpit
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                NEAREST ER &amp; TRAFFIC-FREE ROADS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Computes shortest emergency path, offers driver route alternatives (AI Preemption vs. Traffic-Free Bypass), and reveals live road congestion.
            </p>
          </div>
        </div>

        {activeSession ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-emerald-500/40 px-3.5 py-2 rounded-xl shadow-neon-blue">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">
                  Corridor Status
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  ACTIVE CORRIDOR ENGAGED
                </span>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(selectedHospital ? `${selectedHospital.name}, ${selectedHospital.address}` : 'Hospital')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Turn-by-Turn GPS Navigation</span>
            </a>

            <button
              onClick={handleReleaseCorridor}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
            >
              Patient Handover Complete (Release Corridor)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRoutingAndRoads}
              disabled={isComputingRoutes}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isComputingRoutes ? 'animate-spin' : ''}`} />
              <span>{isComputingRoutes ? 'Computing Optimal Paths...' : 'Refresh Route Optimization'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. GOOGLE MAPS IN-CAB DRIVER NAVIGATION DISPLAY & LIVE TRIP TELEMETRY */}
      {showDriverNav && activeRouteForNav && targetHospital && (
        <div className="space-y-3 relative z-10 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Driver Google Navigation Display &amp; Live Trip Telemetry
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE GOOGLE MAPS GPS VIEW
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-300">
                Active Path: <strong className="text-cyan-300">{activeRouteForNav.route_name.split(':')[0]}</strong> (~{activeRouteForNav.estimated_minutes_preempted} min ETA)
              </span>
              <button
                type="button"
                onClick={() => setShowDriverNav(false)}
                className="px-2.5 py-1 rounded-xl glass-pill text-slate-400 hover:text-white transition text-[11px]"
              >
                Minimize Map
              </button>
            </div>
          </div>

          <DriverNavigationMap
            route={activeRouteForNav}
            hospital={targetHospital}
            pickupAddress={pickupAddress}
            pickupCoords={pickupCoords}
            ambulanceCallsign={selectedAmbulance?.callsign || 'AMB-108-CRITICAL'}
            trafficSignals={trafficSignals}
            trafficRoads={trafficRoads}
            onArrivedAtHospital={() => {
              playAudioAlert("Arrived at hospital trauma center. Handover initiated.");
            }}
          />
        </div>
      )}

      {!showDriverNav && activeRouteForNav && (
        <div className="flex items-center justify-between p-4 rounded-2xl glass-card-ultra border border-cyan-500/40 text-xs relative z-10 shadow-lg">
          <div className="flex items-center gap-2.5 text-cyan-300 font-bold">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Driver GPS Navigation Map is minimized. Ready to resume travel view.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDriverNav(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-neon-blue"
          >
            <Compass className="w-4 h-4" />
            <span>Show Google Navigation Map</span>
          </button>
        </div>
      )}

      {/* Main Two-Column Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Driver In-Cab Configuration & Nearest Hospital (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl glass-card-ultra border border-white/15 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>1. Ambulance In-Cab Dispatch Configuration</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Active Ambulance</label>
                <select
                  value={selectedAmbulanceId}
                  onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {ambulances.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.callsign} ({a.status}) — Fuel: {a.battery_or_fuel_pct}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-bold">Accident / Patient Pickup Location</label>
                  <button
                    type="button"
                    onClick={detectLiveGps}
                    disabled={gpsDetecting}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded transition"
                  >
                    <Compass className={`w-3 h-3 ${gpsDetecting ? 'animate-spin' : ''}`} />
                    {gpsDetecting ? 'Acquiring GPS...' : '📍 Use Live GPS'}
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Patient Trauma State / Priority</label>
                <input
                  type="text"
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* NEAREST HOSPITAL AI ANALYSIS BANNER */}
              {nearestHospital && (
                <div className={`p-3.5 rounded-xl border transition ${
                  isSelectedNearest
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-neon-blue'
                    : 'bg-slate-900/90 border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Milestone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isSelectedNearest ? '🎯 NEAREST HOSPITAL SELECTED' : '📍 NEAREST TRAUMA CENTER AVAILABLE'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {nearestHospital.distance_km} km • ~{nearestHospital.shortest_travel_time_minutes} min ETA
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1.5">{nearestHospital.hospital.name}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{nearestHospital.hospital.address}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Available ER Beds: <strong className="text-emerald-400">{nearestHospital.hospital.available_beds}</strong></span>
                    <span>ICU Capacity: <strong className="text-cyan-400">{nearestHospital.hospital.icu_capacity}</strong></span>
                    {!isSelectedNearest && (
                      <button
                        type="button"
                        onClick={() => setSelectedHospitalId(nearestHospital.hospital.id)}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition"
                      >
                        Switch to Nearest Hospital
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Target Destination Hospital / Trauma Center</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.trauma_level} (Beds: {h.available_beds}, ICU: {h.icu_capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Hospital Capacity Card */}
              {selectedHospital && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Live Hospital ER Status
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      {selectedHospital.trauma_team_status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{selectedHospital.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>Available Beds: <span className="font-bold text-emerald-400">{selectedHospital.available_beds}</span></div>
                    <div>ICU Capacity: <span className="font-bold text-cyan-400">{selectedHospital.icu_capacity}</span></div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ER Direct Desk: {selectedHospital.phone}
                  </div>
                </div>
              )}

              {/* Trigger Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartCorridor}
                  disabled={isActivating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-blue transition transform active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isActivating
                      ? 'Synthesizing Signal Corridors...'
                      : 'Authorize & Activate Green Corridor (< 1 km Preemption)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* LIVE METROPOLITAN TRAFFIC-FREE ROADS & CONGESTION HUD */}
          <div className="p-6 rounded-3xl glass-card-ultra border border-white/15 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Live Traffic &amp; Traffic-Free Roads Grid
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTrafficRoadFilter('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${trafficRoadFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
                >
                  All ({trafficRoads.length})
                </button>
                <button
                  onClick={() => setTrafficRoadFilter('traffic_free')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${trafficRoadFilter === 'traffic_free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'}`}
                >
                  Free Flow ({trafficRoads.filter(r => r.is_traffic_free).length})
                </button>
                <button
                  onClick={() => setTrafficRoadFilter('congested')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${trafficRoadFilter === 'congested' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'}`}
                >
                  Congested ({trafficRoads.filter(r => !r.is_traffic_free).length})
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Live telemetry of metropolitan expressways, bypass corridors, and bottleneck junctions across Bengaluru.
            </p>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredRoads.map((road) => (
                <div
                  key={road.id}
                  className={`p-3 rounded-xl border text-xs transition ${
                    road.is_traffic_free
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                      : road.congestion_level === 'HEAVY_GRIDLOCK'
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                      : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{road.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      road.is_traffic_free
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : road.congestion_level === 'HEAVY_GRIDLOCK'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {road.is_traffic_free ? '🟢 TRAFFIC-FREE' : road.congestion_level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Speed: <strong className={road.is_traffic_free ? 'text-emerald-400' : 'text-rose-400'}>{road.current_speed_kmh} km/h</strong></span>
                    <span>Delay: <strong className={road.delay_minutes === 0 ? 'text-emerald-400' : 'text-amber-400'}>+{road.delay_minutes} min</strong></span>
                    <span className="text-slate-500 uppercase">{road.corridor_type.replace(/_/g, ' ')}</span>
                  </div>

                  <p className="text-[10px] text-slate-300 mt-1 line-clamp-1">{road.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Route Recommendation & Driver Route Cockpit (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* DRIVER ROUTE RECOMMENDATION & ACCEPTANCE SECTION */}
          <div className="p-6 rounded-3xl glass-card-ultra border border-white/15 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  2. Driver Route Recommendation &amp; Path Selection Cockpit
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">
                Driver Choice: Accept Recommended or Select Alternative
              </span>
            </div>

            {/* In-Cab Driver Status Bar */}
            {acceptedRoute ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-300 flex items-center justify-between shadow-neon-blue">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Driver Accepted Active Route
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {acceptedRoute.route_name}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Destination: <strong className="text-cyan-300">{selectedHospital?.name}</strong> • Distance: <strong>{acceptedRoute.distance_km} km</strong> • ETA: <strong className="text-emerald-400">{acceptedRoute.estimated_minutes_preempted} min</strong>
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(selectedHospital ? `${selectedHospital.name}, ${selectedHospital.address}` : 'Hospital')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GPS Guidance</span>
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/40 text-cyan-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    AI Route Recommendation for Pilot &amp; Operations
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Review the 3 generated route options below. The ambulance pilot can tap <strong>"Accept Route"</strong> to authorize the AI Green Corridor or select a Traffic-Free Elevated Bypass.
                  </p>
                </div>
              </div>
            )}

            {/* THREE ROUTE CARDS */}
            {currentHospitalRec ? (
              <div className="space-y-3.5 pt-1">
                {currentHospitalRec.route_options.map((route) => {
                  const isSelected = selectedRouteId === route.route_id;
                  const isAccepted = acceptedRoute?.route_id === route.route_id;

                  return (
                    <div
                      key={route.route_id}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isAccepted
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-neon-blue ring-1 ring-emerald-500'
                          : isSelected
                          ? 'bg-slate-900/90 border-cyan-500/70 shadow-neon-blue'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedRouteId(route.route_id);
                        if (onSelectRouteForMap) onSelectRouteForMap(route);
                      }}
                    >
                      {/* Route Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          {route.is_recommended && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>AI RECOMMENDED</span>
                            </span>
                          )}
                          {route.route_type === 'TRAFFIC_FREE_BYPASS' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              100% TRAFFIC-FREE BYPASS
                            </span>
                          )}
                          {route.route_type === 'SHORTEST_DISTANCE' && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                              SHORTEST MILEAGE
                            </span>
                          )}
                          <h3 className="text-xs font-bold text-white">{route.route_name}</h3>
                        </div>

                        {/* Driver Choice Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isAccepted ? (
                            <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-neon-blue">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Accepted by Driver</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDriverAcceptRoute(route);
                              }}
                              disabled={isAcceptingRoute}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                route.is_recommended
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-neon-blue'
                                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{route.is_recommended ? 'Accept AI Corridor Route' : 'Accept This Route'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Route Telemetry Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">Distance</span>
                          <span className="font-bold text-cyan-400">{route.distance_km} km</span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">Est. Travel Time</span>
                          <span className="font-bold text-emerald-400">
                            ~{route.estimated_minutes_preempted} min
                            {route.time_saved_minutes > 0 && (
                              <span className="text-[10px] text-amber-300 block">(-{route.time_saved_minutes} min saved)</span>
                            )}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">Traffic Congestion</span>
                          <span className={`font-bold ${route.congestion_score_pct < 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {route.congestion_score_pct}% Congested ({route.traffic_free_pct}% Free)
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">Smart Signals</span>
                          <span className="font-bold text-white">
                            {route.signals_preempted_count} of {route.signals_count} Preempted
                          </span>
                        </div>
                      </div>

                      {/* Via Roads */}
                      <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-500">Via:</span>
                        {route.via_roads.map((road, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 text-[10px]">
                            {road}
                          </span>
                        ))}
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                        <div className="space-y-1">
                          {route.driver_pros.map((pro, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-emerald-300">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{pro}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {route.driver_cons.map((con, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Computing optimal hospital routes...
              </div>
            )}
          </div>

          {/* TRAFFIC SIGNALS PREEMPTION SEQUENCE HUD */}
          <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  3. Route Clearance &amp; Smart Traffic Signal Grid
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">
                Rule: Auto-Flips to GREEN when Distance &le; 1.0 km
              </span>
            </div>

            {/* In-Transit Alert Ticker */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Metropolitan Roadway Advisory Broadcast Active
                </span>
                <p className="text-xs text-slate-200 mt-0.5">
                  "ATTENTION ALL MOTORISTS: Emergency Ambulance ({selectedAmbulance?.callsign || 'MEDIC-101'}) inbound. Automated 100% green signal preemption engaged. Clear right lane corridors immediately."
                </p>
              </div>
            </div>

            {/* Traffic Signals Sequence along Corridor */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Corridor Intersections &amp; Dynamic Light States
              </span>

              <div className="space-y-2.5">
                {trafficSignals.map((sig, idx) => {
                  const distance = Number(Math.max(0.2, (idx * 0.8) + simulatedDistanceKm - 1.2).toFixed(2));
                  const isUnderOneKm = distance <= 1.0;
                  const isPreempted = isUnderOneKm || sig.is_overridden;

                  return (
                    <div
                      key={sig.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                        isPreempted
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-neon-blue'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Traffic Light Visual Indicator */}
                        <div className="flex flex-col items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                          <span className={`w-3.5 h-3.5 rounded-full ${isPreempted ? 'bg-slate-800' : 'bg-rose-500 animate-pulse shadow-neon-red'}`} />
                          <span className={`w-3.5 h-3.5 rounded-full ${isPreempted ? 'bg-emerald-400 animate-pulse shadow-neon-blue' : 'bg-slate-800'}`} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white">
                              {sig.intersection_name}
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({sig.id})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Approaching Distance: <span className="font-bold text-cyan-300">{distance} km</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {isPreempted ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>100% GREEN (PREEMPTION ACTIVE)</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">
                            STANDBY (&gt; 1 km away)
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Opposing Traffic: <span className={isPreempted ? 'text-rose-400 font-bold' : 'text-slate-400'}>{isPreempted ? 'LOCKED RED' : 'Normal Cycle'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receiving Hospital ER Preparation Alert Card */}
            {selectedHospital && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Receiving Emergency Room Preparation Status
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                    ER TEAM ACTIVATED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Designated Bay</span>
                    <span className="font-bold text-emerald-400">
                      {selectedHospital.assigned_trauma_bay || 'Trauma Bay 1 (Sterile)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Trauma Surgeon</span>
                    <span className="font-bold text-cyan-400">
                      Dr. Vance &amp; On-Call Team Standby
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Arrival Countdown</span>
                    <span className="font-bold text-amber-400">
                      ~{Math.max(1.2, simulatedDistanceKm * 1.5).toFixed(1)} Minutes
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-[11px] text-slate-300">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    ER Preparedness Directives:
                  </span>
                  {selectedHospital.er_preparedness_notes.map((note, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
