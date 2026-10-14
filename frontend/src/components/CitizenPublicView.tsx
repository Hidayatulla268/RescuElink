import React from 'react';
import { 
  Incident, Hospital, TrafficSignal, GreenCorridorTransitSession, GovernmentUser 
} from '../types';
import { SAMPLE_LOGINS, createGovUserFromSample } from '../services/sampleLogins';
import { 
  ShieldAlert, Camera, Phone, Zap, HeartPulse, Building2, 
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, Radio, KeyRound, Sparkles
} from 'lucide-react';
import { IncidentMap } from './IncidentMap';

interface CitizenPublicViewProps {
  incidents: Incident[];
  hospitals: Hospital[];
  trafficSignals: TrafficSignal[];
  activeCorridor: GreenCorridorTransitSession | null;
  onOpenNewIncident: () => void;
  onOpenSnapAccident: () => void;
  onOpenGovLogin: () => void;
  onOpenCorridorTab: () => void;
  onLoginAsSample: (user: GovernmentUser) => void;
  onSwitchToOperatorView: () => void;
}

export const CitizenPublicView: React.FC<CitizenPublicViewProps> = ({
  incidents,
  hospitals,
  trafficSignals,
  activeCorridor,
  onOpenNewIncident,
  onOpenSnapAccident,
  onOpenGovLogin,
  onOpenCorridorTab,
  onLoginAsSample,
  onSwitchToOperatorView
}) => {
  const activeEmergencies = incidents.filter(i => i.status !== 'RESOLVED');

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto px-4 py-4 max-w-[1700px] w-full mx-auto">
      
      {/* Indian National Emergency Numbers Helpline Bar */}
      <div className="rounded-2xl glass-card-ultra px-4 py-2.5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-base">🇮🇳</span>
          <span className="font-bold text-white tracking-wider">ALL-INDIA EMERGENCY HELPLINE INTEGRATION:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
            📞 112 Unified Emergency
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            🚑 108 Ambulance / EMS
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            🚒 101 Fire & SDRF
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
            🚓 100 Police Rapid Action
          </span>
        </div>
      </div>

      {/* Citizen Hero Banner */}
      <div className="relative rounded-3xl glass-card-ultra p-6 sm:p-8 border border-white/15 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                INDIA EMERGENCY RESPONSE GRID ONLINE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-white/5 border border-white/10">
                Bengaluru Metro Sector
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              RescuE<span className="text-cyan-400">LINK</span> India Citizen Portal
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Instant AI road accident reporting, automated nearest 108 ambulance scramble, and live Green Corridor signal preemption tracking across Bengaluru and Indian metropolitan corridors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSnapAccident}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-neon-amber transition active:scale-95 animate-pulse"
            >
              <Camera className="w-4 h-4" />
              <span>📸 SNAP ROAD ACCIDENT SOS</span>
            </button>

            <button
              onClick={onOpenNewIncident}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-neon-red transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>🚨 DIAL 112 / REPORT EMERGENCY</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Citizen High-Impact Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Road Accident Photo SOS */}
        <div 
          onClick={onOpenSnapAccident}
          className="p-5 rounded-3xl glass-card-ultra border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group space-y-3"
        >
          <div className="space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-neon-amber">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-mono group-hover:text-amber-300 transition">
              Bystander Road Accident Photo SOS
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Take a photo of any vehicle crash on the road. Gemini 3.8 Flash assesses trauma damage in under 2 seconds and auto-scrambles the closest idle ambulance.
            </p>
          </div>
          <div className="flex items-center text-xs font-mono font-bold text-amber-400 gap-1 pt-2">
            <span>Transmit Photo Report</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Green Corridor Roadway Tracker */}
        <div 
          onClick={onOpenCorridorTab}
          className="p-5 rounded-3xl glass-card-ultra border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group space-y-3"
        >
          <div className="space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-neon-green">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-mono group-hover:text-emerald-300 transition">
              Green Corridor Live Roadway Tracker
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time alert of arterial streets currently held on <strong className="text-emerald-300">100% Emergency Green</strong> so motorists can yield and clear lanes for approaching ambulances.
            </p>
          </div>
          <div className="flex items-center text-xs font-mono font-bold text-emerald-400 gap-1 pt-2">
            <span>View Active Corridors</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 3: Trauma Hospital ER Readiness */}
        <div className="p-5 rounded-3xl glass-card-ultra border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-neon-blue">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Trauma Centers & Hospital Readiness
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              4 metropolitan emergency trauma centers synchronized with live surgical bay availability and pre-arrival notification channels.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono text-cyan-300">
            <span>{hospitals.length} Trauma Centers Online</span>
            <span className="text-emerald-400 font-bold">100% Ready</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Live Public Safety Map (Left) & Hospitals List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Clean Public Safety GIS Map */}
        <div className="lg:col-span-8 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Live Public Emergency Radar & Green Corridors</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeEmergencies.length} Active Public Alerts
            </span>
          </div>

          <div className="h-[440px] rounded-3xl glass-card-ultra border border-white/15 overflow-hidden shadow-2xl relative">
            <IncidentMap
              incidents={incidents}
              units={[]}
              sensors={[]}
              hospitals={hospitals}
              trafficSignals={trafficSignals}
              activeCorridor={activeCorridor}
              selectedIncident={null}
              onSelectIncident={() => {}}
            />
          </div>
        </div>

        {/* Right: Hospital ER Readiness Cards */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Emergency Receiving Hospitals</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Trauma Bay Status
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[440px]">
            {hospitals.map((hosp) => (
              <div 
                key={hosp.id}
                className="p-3.5 rounded-2xl glass-card-ultra border border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      {hosp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {hosp.trauma_level}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-slate-300">
                  <span>Available Trauma Bays: <strong className="text-cyan-300">{hosp.available_trauma_bays}/{hosp.total_trauma_bays}</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Surgical Team Standby</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SAMPLE LOGINS FOR TESTING & GOVERNMENT ACCESS SECTION */}
      <div className="p-6 rounded-3xl glass-card-ultra border border-cyan-500/30 bg-gradient-to-r from-slate-900/80 via-slate-950/90 to-slate-900/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <KeyRound className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                SAMPLE GOVERNMENT & FIRST RESPONDER LOGINS (FOR TESTING)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any sample credential below to test role-specific emergency operator controls:
            </p>
          </div>

          <button
            onClick={onSwitchToOperatorView}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white font-mono text-xs font-bold transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>👁️ Operator Console Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Sample Login Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SAMPLE_LOGINS.map((sample) => (
            <div
              key={sample.username}
              className={`p-3.5 rounded-2xl border backdrop-blur-md flex flex-col justify-between space-y-3 transition-all duration-200 ${sample.bgTheme} ${sample.borderTheme}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-cyan-300 border border-white/15">
                    {sample.username}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    pw: {sample.passwordHint}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white font-mono">
                  {sample.name}
                </h4>
                <p className="text-[10px] text-slate-300 font-semibold line-clamp-1">
                  {sample.title}
                </p>
              </div>

              <button
                onClick={() => onLoginAsSample(createGovUserFromSample(sample))}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-neon-blue transition active:scale-95"
              >
                <span>⚡ 1-Click Login</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
