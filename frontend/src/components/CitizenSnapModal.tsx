import React, { useState } from 'react';
import { AutoScrambleResult } from '../types';
import { api } from '../services/api';
import { 
  X, Camera, AlertTriangle, Truck, Sparkles, CheckCircle2, 
  MapPin, ShieldAlert, ArrowRight, Zap, Navigation
} from 'lucide-react';

interface CitizenSnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoScrambled: (result: AutoScrambleResult) => void;
  onOpenGreenCorridor: () => void;
}

export const CitizenSnapModal: React.FC<CitizenSnapModalProps> = ({
  isOpen,
  onClose,
  onAutoScrambled,
  onOpenGreenCorridor
}) => {
  if (!isOpen) return null;

  const [locationAddress, setLocationAddress] = useState<string>(
    'Market St & 6th St Intersection, Downtown Corridor'
  );
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 37.7815,
    lng: -122.4110
  });
  const [notes, setNotes] = useState<string>(
    'High-speed two-car collision at intersection. Driver trapped in driver seat, smoke emerging from crushed radiator.'
  );
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scrambleResult, setScrambleResult] = useState<AutoScrambleResult | null>(null);

  const presets = [
    {
      title: 'Two-Car Intersection T-Bone Collision',
      loc: 'Market St & 6th St Intersection',
      coords: { lat: 37.7815, lng: -122.4110 },
      notes: 'Severe side-impact collision. Driver door deformed, passenger screaming in shock. Liquid leaking onto asphalt.',
      badge: 'High Impact Trauma'
    },
    {
      title: 'Motorcycle Highway Skid & Pinned Rider',
      loc: 'Bay Bridge Inbound On-Ramp at 5th St',
      coords: { lat: 37.7830, lng: -122.4010 },
      notes: 'Motorcycle slipped on wet steel expansion plate. Rider thrown 15 meters, unresponsive on left shoulder.',
      badge: 'Critical Life-Threat'
    },
    {
      title: 'Pedestrian Struck by Vehicle Crosswalk',
      loc: 'Mission St & 16th St Transit Hub',
      coords: { lat: 37.7650, lng: -122.4198 },
      notes: 'Pedestrian struck while crossing. Severe lower extremity trauma and head laceration.',
      badge: 'Acute Trauma'
    }
  ];

  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    setLocationAddress(presets[idx].loc);
    setCoordinates(presets[idx].coords);
    setNotes(presets[idx].notes);
  };

  const handleSnapAndScramble = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.reportAccidentSnap({
        image_base64: 'data:image/jpeg;base64,simulated_roadway_crash_capture',
        location_address: locationAddress,
        coordinates: coordinates,
        reporter_name: 'Bystander Citizen',
        reporter_phone: '+1 (415) 555-8291',
        optional_notes: notes
      });
      setScrambleResult(res);
      onAutoScrambled(res);
    } catch (err) {
      alert(`Accident intake failed: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] font-mono animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-neon-red">
              <Camera className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Road Accident Photo SOS — Instant Ambulance Auto-Scramble
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                AI Scene Verification & Zero-Delay Nearest Ambulance Mobilization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/50 transition active:scale-95 shadow-md"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {!scrambleResult ? (
            <>
              {/* Presets Selection */}
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block mb-2">
                  📸 Select Accident Scene Simulation Capture:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {presets.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => applyPreset(idx)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        selectedPreset === idx
                          ? 'bg-rose-950/30 border-rose-500/60 shadow-neon-red'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Camera className="w-4 h-4 text-rose-400" />
                        <div>
                          <span className="font-bold text-white block">{p.title}</span>
                          <span className="text-[10px] text-slate-400">{p.loc}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        {p.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Viewfinder Mockup */}
              <div className="relative h-44 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-center p-4">
                <div className="absolute inset-2 border border-dashed border-cyan-500/30 rounded-lg pointer-events-none" />
                <div className="absolute top-3 left-3 text-[10px] text-cyan-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>OPTICAL SCENE RETICLE READY</span>
                </div>
                <Camera className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-slate-300 font-bold">Roadway Collision Scene Captured</p>
                <p className="text-[10px] text-slate-500 max-w-sm mt-1">
                  {presets[selectedPreset].notes}
                </p>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Accident Location Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Scene Notes / Observations</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleSnapAndScramble}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-red transition transform active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isSubmitting
                      ? 'Gemini Vision Triaging & Scrambling Closest Ambulance...'
                      : 'Snap Photo & Auto-Scramble Nearest Free Ambulance'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Success & Auto-Scrambled Ambulance Screen */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ambulance Dispatched Instantly
                </h3>
                <p className="text-xs text-emerald-300">
                  Gemini analyzed accident photo • Nearest available duty unit scrambled with zero dispatcher lag!
                </p>
              </div>

              {/* Dispatched Unit Details */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-white text-sm">
                      {scrambleResult.assigned_ambulance_callsign}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    {scrambleResult.priority} CRITICAL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block">Distance to Scene</span>
                    <span className="font-bold text-cyan-300 text-sm">{scrambleResult.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block">Estimated Arrival (ETA)</span>
                    <span className="font-bold text-amber-400 text-sm">~{scrambleResult.eta_minutes} Minutes</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold mb-0.5">
                    Gemini Multimodal Scene Assessment:
                  </span>
                  {scrambleResult.triage_summary}
                </div>
              </div>

              {/* Next Steps: Green Corridor */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-emerald-300 block text-xs">
                    Next: Patient Transport & Green Corridor
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Set destination hospital to engage &lt; 1 km smart traffic light green preemption.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenGreenCorridor();
                  }}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 shadow-neon-blue transition"
                >
                  <span>Open Green Corridor HUD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
