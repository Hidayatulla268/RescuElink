import React, { useState } from 'react';
import { 
  Incident, Hospital, TrafficSignal, GreenCorridorTransitSession, GovernmentUser, RoadSegment 
} from '../types';
import { 
  ShieldAlert, Camera, Phone, Zap, HeartPulse, Building2, 
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, Radio, 
  Sparkles, ShieldCheck, Scale, PhoneCall, ExternalLink, HelpCircle,
  Activity, Navigation, Compass, ChevronDown, ChevronUp, LifeBuoy
} from 'lucide-react';
import { IncidentMap } from './IncidentMap';

interface CitizenPublicViewProps {
  incidents: Incident[];
  hospitals: Hospital[];
  trafficSignals: TrafficSignal[];
  activeCorridor: GreenCorridorTransitSession | null;
  trafficRoads?: RoadSegment[];
  onOpenNewIncident: () => void;
  onOpenSnapAccident: () => void;
  onOpenGovLogin: () => void;
  onOpenCorridorTab: () => void;
  onLoginAsSample?: (user: GovernmentUser) => void;
  onSwitchToOperatorView: () => void;
}

export const CitizenPublicView: React.FC<CitizenPublicViewProps> = ({
  incidents,
  hospitals,
  trafficSignals,
  activeCorridor,
  trafficRoads = [],
  onOpenNewIncident,
  onOpenSnapAccident,
  onOpenGovLogin,
  onOpenCorridorTab,
  onSwitchToOperatorView
}) => {
  const activeEmergencies = incidents.filter(i => i.status !== 'RESOLVED');
  const [showFirstAidTips, setShowFirstAidTips] = useState<boolean>(false);
  const [activeTrafficFilter, setActiveTrafficFilter] = useState<'all' | 'free' | 'jam'>('all');

  // Traffic roads segmentation
  const freeFlowRoads = trafficRoads.filter(r => r.is_traffic_free);
  const congestedRoads = trafficRoads.filter(r => !r.is_traffic_free);

  const displayedRoads = activeTrafficFilter === 'free' 
    ? freeFlowRoads 
    : activeTrafficFilter === 'jam' 
    ? congestedRoads 
    : trafficRoads;

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto px-3 sm:px-6 py-4 max-w-[1720px] w-full mx-auto relative">
      
      {/* Floating Ambient Glowing Glass Lights (VisionOS Style) */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Indian National Emergency Helpline Bar (Full Frosted Glass) */}
      <div className="relative z-10 rounded-2xl glass-card-ultra px-4 py-3 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🇮🇳</span>
          <span className="font-bold text-white tracking-wider">
            ALL-INDIA EMERGENCY CONTACT HELPLINES:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a 
            href="tel:112" 
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            🚨 112 Unified Emergency
          </a>
          <a 
            href="tel:108" 
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            🚑 108 Medical Ambulance
          </a>
          <a 
            href="tel:101" 
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            🚒 101 Fire & Rescue
          </a>
          <a 
            href="tel:100" 
            className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            🚓 100 Police Rapid Response
          </a>
        </div>
      </div>

      {/* 2. Citizen Welcome Hero Banner (Full Liquid Glass Finish) */}
      <div className="relative z-10 rounded-3xl glass-card-ultra p-6 sm:p-8 border border-white/20 overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SMART EMERGENCY DISPATCH GRID ACTIVE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-white/5 border border-white/15">
                Bengaluru Metropolitan Sector
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              RescuE<span className="text-cyan-400">LINK</span> Citizen Safety Portal
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
              Instant medical and emergency assistance for every citizen. Snap a photo of a road accident to alert the nearest <strong>108 Ambulance</strong>, find open emergency hospital beds, and watch traffic lights clear to green all the way to the emergency room.
            </p>
          </div>

          {/* Big Action SOS Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onOpenSnapAccident}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-sm font-bold flex items-center justify-center gap-2.5 shadow-neon-amber transition transform active:scale-95 animate-pulse"
            >
              <Camera className="w-5 h-5" />
              <span>📸 SNAP ROAD ACCIDENT SOS</span>
            </button>

            <button
              onClick={onOpenNewIncident}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-sm font-bold flex items-center justify-center gap-2.5 shadow-neon-red transition transform active:scale-95"
            >
              <Phone className="w-5 h-5" />
              <span>🚨 REPORT 112 / 108 EMERGENCY</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. "How RescuELINK Works in 3 Simple Steps" - Easy to Understand for Everyone */}
      <div className="relative z-10 p-6 rounded-3xl glass-card-ultra border border-white/15 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>How RescuELINK Saves Lives in 3 Simple Steps</span>
            </h2>
            <p className="text-xs text-slate-300 font-sans">
              Designed so that any bystander or commuter can save someone's life in seconds
            </p>
          </div>

          <button
            onClick={() => setShowFirstAidTips(!showFirstAidTips)}
            className="px-3.5 py-1.5 rounded-xl glass-button-glow text-cyan-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition"
          >
            <LifeBuoy className="w-4 h-4 text-cyan-400" />
            <span>{showFirstAidTips ? 'Hide First Aid Guide' : '🩹 View Quick First Aid Guide'}</span>
            {showFirstAidTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1 */}
          <div className="p-4 rounded-2xl glass-card-interactive border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center font-bold font-mono text-sm">
                1
              </span>
              <span className="text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                You (Bystander)
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">
              📸 Take a Photo or Call 112
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              If you witness an accident, take a photo with your phone or tap to call. The AI instantly verifies vehicle damage and locks your GPS coordinates.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl glass-card-interactive border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 flex items-center justify-center font-bold font-mono text-sm">
                2
              </span>
              <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Autonomous Dispatch
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">
              🚑 Nearest Ambulance Scrambled
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              The closest available 108 ambulance is dispatched immediately. The driver receives 3 route choices and avoids heavy city traffic jams.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl glass-card-interactive border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center font-bold font-mono text-sm">
                3
              </span>
              <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Green Corridor
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">
              🟢 Traffic Lights Turn Green
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Traffic signals turn 100% green before the ambulance arrives. The hospital ER prepares a trauma bay in advance, cutting transit time by up to 14 minutes.
            </p>
          </div>

        </div>

        {/* Expandable Quick First Aid Guide for Normal People */}
        {showFirstAidTips && (
          <div className="pt-4 border-t border-white/10 space-y-3 animate-fade-in">
            <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              <span>Life-Saving First Aid While Waiting for 108 Ambulance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-amber-300 font-mono text-xs">🚗 Road Crash Care:</span>
                <p className="text-slate-300 font-sans">Do NOT twist or move the victim's neck or spine unless they are in immediate fire danger.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-rose-300 font-mono text-xs">🩸 Severe Bleeding:</span>
                <p className="text-slate-300 font-sans">Press firmly and continuously directly on the wound with a clean cloth. Do not let go until paramedics take over.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-cyan-300 font-mono text-xs">🫀 Chest Pain / Breathing:</span>
                <p className="text-slate-300 font-sans">Seat the person comfortably, loosen tight clothing around the neck, and keep them calm while 108 is en route.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-bold text-emerald-300 font-mono text-xs">🧯 Burns & Fire:</span>
                <p className="text-slate-300 font-sans">Cool the burned skin with clean room-temperature running water for 10-15 minutes. Never apply ice or toothpaste.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Interactive Map & Receiving Hospital Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        
        {/* Left: Full Interactive GIS Emergency & Traffic Radar Map (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Live Emergency Radar, Traffic Congestion & Green Corridors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {activeEmergencies.length} Active Alerts
              </span>
              <button
                onClick={onOpenCorridorTab}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold hover:bg-emerald-500/30 transition"
              >
                Open Driver Cockpit ➔
              </button>
            </div>
          </div>

          <div className="h-[480px] rounded-3xl glass-card-ultra border border-white/15 overflow-hidden shadow-2xl relative">
            <IncidentMap
              incidents={incidents}
              units={[]}
              sensors={[]}
              hospitals={hospitals}
              trafficSignals={trafficSignals}
              activeCorridor={activeCorridor}
              trafficRoads={trafficRoads}
              selectedIncident={null}
              onSelectIncident={() => {}}
            />
          </div>
        </div>

        {/* Right: Hospital ER Readiness & Open Trauma Beds (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Emergency Receiving Hospitals</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Live Trauma Beds
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px]">
            {hospitals.map((hosp) => (
              <div 
                key={hosp.id}
                className="p-4 rounded-2xl glass-card-ultra border border-white/15 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      {hosp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                    {hosp.trauma_level.split(' ')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-xl text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400">Emergency Beds:</span>
                    <div className="text-emerald-400 font-bold text-xs">
                      🟢 {hosp.available_trauma_bays} Free of {hosp.total_trauma_bays}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">ICU Capacity:</span>
                    <div className="text-cyan-300 font-bold text-xs">
                      {hosp.icu_beds_free} Available
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.coordinates.lat},${hosp.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-white flex items-center gap-1 transition"
                  >
                    <span>📍 Google Maps Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href="tel:108"
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <span>📞 Call 108</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Live Road Traffic Status (Free Flow Expressways vs Traffic Jams) */}
      {trafficRoads.length > 0 && (
        <div className="relative z-10 p-5 rounded-3xl glass-card-ultra border border-white/15 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Metropolitan Road Traffic Conditions
                </h3>
                <p className="text-xs text-slate-300 font-sans">
                  Real-time speed and congestion telemetry for ambulance corridors and daily commuters
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl glass-pill font-mono text-xs">
              <button
                onClick={() => setActiveTrafficFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTrafficFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Roads ({trafficRoads.length})
              </button>
              <button
                onClick={() => setActiveTrafficFilter('free')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTrafficFilter === 'free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 Free Flow ({freeFlowRoads.length})
              </button>
              <button
                onClick={() => setActiveTrafficFilter('jam')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTrafficFilter === 'jam' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 Heavy Traffic ({congestedRoads.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayedRoads.map((road) => {
              const isFree = road.is_traffic_free;
              const isGridlock = road.congestion_level === 'HEAVY_GRIDLOCK';

              return (
                <div
                  key={road.id}
                  className={`p-3.5 rounded-2xl glass-card-interactive border space-y-1.5 ${
                    isFree 
                      ? 'border-emerald-500/30 bg-emerald-950/15' 
                      : isGridlock 
                      ? 'border-rose-500/30 bg-rose-950/15' 
                      : 'border-amber-500/30 bg-amber-950/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isFree 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : isGridlock 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isFree ? '🟢 FREE FLOW' : isGridlock ? '🔴 TRAFFIC JAM' : '🟡 MODERATE'}
                    </span>
                    <span className="text-white font-mono font-bold text-xs">
                      {road.current_speed_kmh} km/h
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white font-mono line-clamp-1">
                    {road.name}
                  </h4>

                  <p className="text-[10px] text-slate-300 font-sans line-clamp-2 leading-relaxed">
                    {road.description}
                  </p>

                  <div className="pt-1 border-t border-white/10 text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{isFree ? '✓ Fast Emergency Route' : `Delay: +${road.delay_minutes} min`}</span>
                    <span className="text-cyan-300">{road.corridor_type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Legal Safety Guarantee: Good Samaritan Law (Sec 134A) & 24/7 Helpline Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 relative z-10">
        
        {/* Good Samaritan Protection */}
        <div className="p-6 rounded-3xl glass-card-ultra border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon-green">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                Good Samaritan Legal Protection (Sec 134A MV Act)
              </h3>
              <p className="text-[11px] font-mono text-emerald-300">
                Supreme Court of India & Ministry of Road Transport Guidelines
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            Indian law strictly protects citizens who assist accident victims or report emergencies:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 font-sans list-disc list-inside">
            <li><strong>Zero Legal or Civil Liability:</strong> You will never be held legally responsible for helping an injured victim.</li>
            <li><strong>No Compulsory Police Interrogation:</strong> Police cannot force you to reveal your identity or attend court.</li>
            <li><strong>Immediate Hospital Admission:</strong> Hospitals cannot demand upfront deposits or deny emergency trauma care.</li>
          </ul>
        </div>

        {/* 24/7 Helpline Directory */}
        <div className="p-6 rounded-3xl glass-card-ultra border border-cyan-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-neon-blue">
              <PhoneCall className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                24/7 Emergency Helplines (Karnataka & All India)
              </h3>
              <p className="text-[11px] font-mono text-cyan-300">
                Direct Telephonic Access to Rescue and First Responders
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <a href="tel:112" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 transition flex items-center justify-between">
              <span className="text-slate-200">112 Unified</span>
              <strong className="text-rose-400">Toll Free</strong>
            </a>
            <a href="tel:108" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 transition flex items-center justify-between">
              <span className="text-slate-200">108 Ambulance</span>
              <strong className="text-emerald-400">24/7 Rapid</strong>
            </a>
            <a href="tel:101" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 transition flex items-center justify-between">
              <span className="text-slate-200">101 Fire</span>
              <strong className="text-amber-400">Disaster</strong>
            </a>
            <a href="tel:100" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 transition flex items-center justify-between">
              <span className="text-slate-200">100 Police</span>
              <strong className="text-cyan-400">Rapid</strong>
            </a>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs font-mono">
            <span className="text-slate-400">Are you a Dispatcher / Police / Doctor?</span>
            <button
              onClick={onOpenGovLogin}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition"
            >
              <span>🏛️ Officer Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-4 pb-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>RescuELINK Smart City Emergency Command System • National Public Safety Infrastructure</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSwitchToOperatorView}
            className="hover:text-cyan-300 underline underline-offset-4 transition"
          >
            Tactical Operations Console
          </button>
          <button
            onClick={onOpenGovLogin}
            className="hover:text-cyan-300 underline underline-offset-4 transition"
          >
            Authorized Personnel Portal
          </button>
        </div>
      </footer>

    </div>
  );
};
