import React, { useState, useEffect } from 'react';
import { 
  ResponderUnit, Hospital, TrafficSignal, GreenCorridorTransitSession 
} from '../types';
import { api } from '../services/api';
import { 
  Navigation, ShieldAlert, Radio, AlertTriangle, CheckCircle2, 
  MapPin, Clock, Truck, Building2, Flame, HeartPulse, Volume2, Sparkles, Zap
} from 'lucide-react';

interface GreenCorridorCockpitProps {
  units: ResponderUnit[];
  hospitals: Hospital[];
  trafficSignals: TrafficSignal[];
  onCorridorActivated?: (session: GreenCorridorTransitSession) => void;
}

export const GreenCorridorCockpit: React.FC<GreenCorridorCockpitProps> = ({
  units,
  hospitals,
  trafficSignals,
  onCorridorActivated
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

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
  const selectedAmbulance = units.find(u => u.id === selectedAmbulanceId);

  // Simulation timer to move ambulance closer and demonstrate the < 1.0 km green signal trigger!
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      setSimulatedDistanceKm(prev => {
        const next = Math.max(0.1, Number((prev - 0.25).toFixed(2)));
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
        pickup_coordinates: { lat: 12.9180, lng: 77.6240 },
        patient_condition: patientCondition
      });
      setActiveSession(session);
      setSimulatedDistanceKm(2.4);
      if (onCorridorActivated) onCorridorActivated(session);
    } catch (err) {
      alert(`Activation failed: ${err}`);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 space-y-6 font-mono">
      {/* Cockpit Banner Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-command-panel to-slate-900 border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 shadow-neon-blue text-emerald-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold uppercase tracking-wider text-white">
                GreenCorridor AI™ — Smart Traffic Signal Preemption & ER Protocol
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                PROXIMITY &lt; 1 KM OVERRIDE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous dynamic traffic signal clearance, opposing-lane lockouts, and live Trauma Center ER preparation.
            </p>
          </div>
        </div>

        {activeSession && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/40 px-4 py-2.5 rounded-xl shadow-neon-blue">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Corridor Status
              </span>
              <span className="text-xs font-bold text-emerald-400">
                ACTIVE GREEN CORRIDOR IN PROGRESS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Driver Route & Hospital Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl space-y-4">
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
                <label className="block text-slate-400 mb-1 font-bold">Accident / Patient Pickup Location</label>
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

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Target Destination Hospital / Trauma Center</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.trauma_level} (Beds: {h.available_beds})
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
        </div>

        {/* Right Column: Live Route Preemption HUD & Traffic Signal Synchronization (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  2. Route Clearance & Smart Traffic Signal Grid
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
                Corridor Intersections & Dynamic Light States
              </span>

              <div className="space-y-2.5">
                {trafficSignals.map((sig, idx) => {
                  // Simulate realistic distance along route based on index and simulated progress
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
                      Dr. Vance & On-Call Team Standby
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
