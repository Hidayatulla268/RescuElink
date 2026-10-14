import React from 'react';
import { 
  X, Camera, Phone, Zap, HeartPulse, ShieldCheck, MapPin, 
  CheckCircle2, AlertTriangle, ArrowRight, Activity, Sparkles
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSnapAccident: () => void;
  onOpenNewIncident: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSnapAccident,
  onOpenNewIncident
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl glass-card-ultra border border-cyan-500/30 p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] animate-modal-in space-y-5">
        
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-neon-blue">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>How RescuE<span className="text-cyan-400">LINK</span> Works</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Easy Guide
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 font-sans">
                Simple 3-step guide for citizens, bystanders, and emergency drivers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Simple Steps */}
        <div className="relative z-10 space-y-3 font-sans">
          <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
            3 Simple Steps to Save a Life
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl glass-card-ultra border border-amber-500/30 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 font-bold font-mono">
                1
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-mono">
                    📸 Snap a Photo or Tap to Call
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Citizen
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Witnessed a road accident or medical crisis? Tap <strong>SNAP ROAD ACCIDENT SOS</strong> or call <strong>112 / 108</strong>. The camera optical scanner instantly detects injury severity and automatically locks your exact GPS location.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl glass-card-ultra border border-cyan-500/30 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 font-bold font-mono">
                2
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-mono">
                    🚑 Nearest 108 Ambulance Scrambled
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    Autonomous AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The system instantly notifies the closest idle 108 ambulance. The driver is given <strong>3 smart route choices</strong> (including traffic-free elevated expressways) and can accept the best route in 1 tap.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl glass-card-ultra border border-emerald-500/30 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 font-bold font-mono">
                3
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-mono">
                    🟢 Traffic Lights Automatically Turn Green
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Green Corridor
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Traffic signals automatically switch to <strong>100% Green</strong> as the ambulance approaches. The receiving hospital ER prepares an open trauma bay before the patient even arrives, saving critical minutes in the "Golden Hour".
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Map Color Meaning Guide */}
        <div className="relative z-10 space-y-2.5 font-sans">
          <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
            What Do The Colors Mean on the Map?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-neon-green shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">🟢 Green Road</span>
                <p className="text-[10px] text-slate-300 font-sans">Traffic-free rapid expressway. Ambulances speed through without delays.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
              <div>
                <span className="font-bold text-rose-300">🔴 Red Road</span>
                <p className="text-[10px] text-slate-300 font-sans">Heavy traffic jam. The system automatically routes the ambulance around it.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rotate-45 bg-rose-500 shrink-0" />
              <div>
                <span className="font-bold text-white">🚨 Crisis Beacon</span>
                <p className="text-[10px] text-slate-300 font-sans">Active emergency site being responded to by police, fire, or ambulance.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-500 shrink-0 flex items-center justify-center text-[9px] text-white font-bold">+</span>
              <div>
                <span className="font-bold text-indigo-300">🏥 Trauma Hospital</span>
                <p className="text-[10px] text-slate-300 font-sans">Emergency hospital showing ready trauma bays and surgical team standby.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Good Samaritan Shield Reminder */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3 text-xs">
          <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
          <p className="text-slate-300 leading-relaxed font-sans">
            <strong className="text-emerald-300 font-mono">Good Samaritan Protection (Sec 134A):</strong> In India, you have 100% legal protection and zero liability when helping an accident victim or calling 112/108.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              onClose();
              onOpenSnapAccident();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-amber transition active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>📸 Snap Photo SOS</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenNewIncident();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-red transition active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>🚨 Report Emergency</span>
          </button>
        </div>

      </div>
    </div>
  );
};
