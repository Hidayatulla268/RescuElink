import { 
  Incident, ResponderUnit, IoTSensor, Hospital, TrafficSignal, 
  GreenCorridorTransitSession, GovernmentUser, RoadSegment, HospitalRouteOption 
} from '../types';
import { 
  AlertTriangle, Shield, MapPin, Camera, Radio, 
  HeartPulse, ShieldCheck, UserCheck, Flame, Cpu, 
  ChevronRight, Phone, Clock, Send, Sparkles, LogIn, LogOut
} from 'lucide-react';
import { IncidentMap } from './IncidentMap';
import { GreenCorridorCockpit } from './GreenCorridorCockpit';

interface MobileAppViewProps {
  incidents: Incident[];
  units: ResponderUnit[];
  sensors: IoTSensor[];
  hospitals: Hospital[];
  trafficSignals: TrafficSignal[];
  activeCorridor: GreenCorridorTransitSession | null;
  governmentUser: GovernmentUser | null;
  trafficRoads?: RoadSegment[];
  onOpenInspect: (incident: Incident) => void;
  onOpenNewIncident: () => void;
  onOpenSnapAccident: () => void;
  onOpenGovLogin: () => void;
  onOpenBroadcast: (incident: Incident) => void;
  onCorridorActivated: (session: GreenCorridorTransitSession) => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  incidents,
  units,
  sensors,
  hospitals,
  trafficSignals,
  activeCorridor,
  governmentUser,
  trafficRoads = [],
  onOpenInspect,
  onOpenNewIncident,
  onOpenSnapAccident,
  onOpenGovLogin,
  onOpenBroadcast,
  onCorridorActivated
}) => {
  const [mobileTab, setMobileTab] = useState<'feed' | 'map' | 'corridor' | 'profile'>('feed');
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<HospitalRouteOption | null>(null);
  const [currentTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const activeP1 = incidents.filter(i => i.priority === 'P1' && i.status !== 'RESOLVED');

  return (
    <div className="flex-1 flex items-center justify-center py-2 px-2 overflow-y-auto">
      {/* Smartphone Chassis Container */}
      <div className="mobile-device-frame flex flex-col bg-[#070B12] border-2 border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.9)] text-slate-100 font-sans">
        
        {/* Mobile Status Bar & Dynamic Island */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between text-xs font-mono text-slate-400 select-none bg-black/40 backdrop-blur-md">
          <span>{currentTime}</span>
          
          {/* Dynamic Island Pill */}
          <div className="px-3 py-1 rounded-full bg-black/90 border border-white/15 flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] text-cyan-300 font-bold tracking-wider">
              🇮🇳 RESCUELINK 112 / 108
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span>100%</span>
            <div className="w-5 h-2.5 rounded-sm border border-slate-400 p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 via-white to-emerald-500 text-black shadow-md">
              <Shield className="w-5 h-5 fill-current text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-mono text-white tracking-wide flex items-center gap-1">
                <span>RescuELINK</span>
                <span className="text-[10px] text-amber-300 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 font-bold">
                  INDIA 🇮🇳
                </span>
              </h1>
              <div className="flex items-center gap-1.5">
                {governmentUser ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>{governmentUser.badgeNumber} ({governmentUser.role.split('_')[0]})</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Citizen Public Mode</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {governmentUser ? (
              <button
                onClick={onOpenGovLogin}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                Gov ID
              </button>
            ) : (
              <button
                onClick={onOpenGovLogin}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/15 transition flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                <span>Gov Login</span>
              </button>
            )}

            <button
              onClick={onOpenSnapAccident}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-neon-red transition flex items-center gap-1 animate-pulse"
            >
              <Camera className="w-3 h-3" />
              <span>SOS</span>
            </button>
          </div>
        </div>

        {/* Mobile View Screen Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* TAB 1: INCIDENT FEED (MOBILE) */}
          {mobileTab === 'feed' && (
            <div className="space-y-3">
              {/* Emergency Banner */}
              <div className="p-3 rounded-2xl glass-card-ultra border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900/40 to-slate-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 animate-bounce" />
                    <span>Citywide Critical Incidents: {activeP1.length} Active</span>
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-time AI dispatch & Green Corridor active
                  </p>
                </div>
                <button
                  onClick={onOpenNewIncident}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono font-bold shadow-neon-blue active:scale-95 transition"
                >
                  + Report
                </button>
              </div>

              {/* Incidents List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Live Dispatch Feed ({incidents.length})
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">Tap to inspect</span>
                </div>

                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => onOpenInspect(incident)}
                    className="p-3.5 rounded-2xl glass-card-ultra border border-white/10 hover:border-cyan-500/40 active:scale-[0.98] transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          incident.priority === 'P1'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : incident.priority === 'P2'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                        }`}>
                          {incident.priority}
                        </span>
                        <span className="text-xs font-bold text-white font-mono truncate max-w-[180px]">
                          {incident.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {incident.raw_description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[170px]">{incident.location_address}</span>
                      </span>
                      <span className="text-rose-400 font-bold">
                        {incident.triage?.severity_score || 70}% Severity
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TACTICAL MAP (MOBILE) */}
          {mobileTab === 'map' && (
            <div className="h-[620px] rounded-2xl overflow-hidden border border-white/15 relative">
              <IncidentMap
                incidents={incidents}
                units={units}
                sensors={sensors}
                hospitals={hospitals}
                trafficSignals={trafficSignals}
                activeCorridor={activeCorridor}
                selectedRoute={selectedRouteForMap}
                trafficRoads={trafficRoads}
                selectedIncident={incidents[0] || null}
                onSelectIncident={(inc) => onOpenInspect(inc)}
              />
            </div>
          )}

          {/* TAB 3: GREEN CORRIDOR CAB (MOBILE) */}
          {mobileTab === 'corridor' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl glass-card-ultra border border-emerald-500/30 bg-emerald-950/20">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4" />
                  <span>Green Corridor Driver In-Cab Console</span>
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  Autonomous &lt; 1.0 km traffic light preemption & hospital trauma bay reservation.
                </p>
              </div>

              <GreenCorridorCockpit
                units={units}
                hospitals={hospitals}
                trafficSignals={trafficSignals}
                onSelectRouteForMap={(r) => setSelectedRouteForMap(r)}
                onCorridorActivated={onCorridorActivated}
              />
            </div>
          )}

          {/* TAB 4: PROFILE & GOV STATUS */}
          {mobileTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl glass-card-ultra border border-white/15 text-center space-y-2">
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-white">
                    {governmentUser ? governmentUser.fullName : 'Citizen Public Guest'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {governmentUser ? governmentUser.roleTitle : 'Open Access SOS & Advisory Portal'}
                  </p>
                </div>

                {governmentUser ? (
                  <div className="pt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Clearance: {governmentUser.clearanceLevel}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300 border border-white/15">
                      No Login Required for Public
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={onOpenGovLogin}
                  className="w-full py-3 rounded-2xl glass-card-ultra border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {governmentUser ? 'Manage Official Credentials / Switch Role' : 'Government Worker Login (Optional)'}
                  </span>
                </button>

                <button
                  onClick={onOpenSnapAccident}
                  className="w-full py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono font-bold text-rose-300 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Report Road Accident via Photo SOS</span>
                </button>
              </div>

              {/* City Health Stats */}
              <div className="p-3.5 rounded-2xl glass-card-ultra border border-white/10 space-y-2 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Municipal Emergency Grid Status
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500">Trauma Centers</span>
                    <p className="text-white font-bold">{hospitals.length} Ready</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500">Smart Signals</span>
                    <p className="text-emerald-400 font-bold">{trafficSignals.length} Active</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500">Active Units</span>
                    <p className="text-cyan-400 font-bold">{units.length} Fleet</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500">IoT Hazards</span>
                    <p className="text-amber-400 font-bold">{sensors.length} Monitored</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Thumb Glass Navigation Bar */}
        <div className="px-3 py-2 border-t border-white/10 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-around select-none">
          <button
            onClick={() => setMobileTab('feed')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              mobileTab === 'feed'
                ? 'text-cyan-400 font-bold bg-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-mono">Alerts</span>
          </button>

          <button
            onClick={() => setMobileTab('map')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              mobileTab === 'map'
                ? 'text-cyan-400 font-bold bg-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-mono">Radar Map</span>
          </button>

          <button
            onClick={() => setMobileTab('corridor')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              mobileTab === 'corridor'
                ? 'text-emerald-400 font-bold bg-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-5 h-5" />
            <span className="text-[10px] font-mono">Corridor</span>
          </button>

          <button
            onClick={() => setMobileTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              mobileTab === 'profile'
                ? 'text-cyan-400 font-bold bg-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-mono">{governmentUser ? 'Gov Portal' : 'Access'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
