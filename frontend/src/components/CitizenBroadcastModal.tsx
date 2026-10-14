import React, { useState } from 'react';
import { Incident, CitizenBroadcastResponse } from '../types';
import { api } from '../services/api';
import { 
  X, Radio, Globe, Send, CheckCircle2, Copy, 
  Sparkles, ShieldAlert, Volume2, Navigation
} from 'lucide-react';

interface CitizenBroadcastModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CitizenBroadcastModal: React.FC<CitizenBroadcastModalProps> = ({
  incident,
  isOpen,
  onClose
}) => {
  if (!isOpen || !incident) return null;

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'English', 'Spanish', 'Hindi', 'French'
  ]);
  const [advisoryType, setAdvisoryType] = useState<string>('EVACUATION_OR_SHELTER');
  const [broadcastData, setBroadcastData] = useState<CitizenBroadcastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [transmitted, setTransmitted] = useState<boolean>(false);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const availableLanguages = ['English', 'Spanish', 'Hindi', 'French', 'Arabic'];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setTransmitted(false);
    try {
      const res = await api.generateBroadcast(
        incident.id,
        selectedLanguages,
        advisoryType
      );
      setBroadcastData(res);
    } catch (err) {
      alert(`Generation failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, lang: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  const handleTransmitBroadcast = () => {
    setTransmitted(true);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !incident) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-modal-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md font-mono">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-neon-blue">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Multilingual Citizen Broadcast Studio
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automated Localization & Emergency Push Notification System
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 font-mono text-xs">
          {/* Incident Anchor */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Crisis Incident Subject</span>
              <p className="text-xs font-bold text-white">{incident.title}</p>
              <p className="text-[11px] text-slate-400">{incident.location_address}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
              {incident.priority}
            </span>
          </div>

          {/* Config Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold uppercase text-[10px]">
                Target Broadcast Languages
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableLanguages.map(lang => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg border transition ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-bold uppercase text-[10px]">
                Advisory Directive
              </label>
              <select
                value={advisoryType}
                onChange={(e) => setAdvisoryType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="EVACUATION_OR_SHELTER">Evacuation & Safe Perimeter</option>
                <option value="SHELTER_IN_PLACE">Shelter Indoors (Airborne Hazard)</option>
                <option value="FLASH_FLOOD_AVOIDANCE">Flash Flood & Transit Detour</option>
                <option value="TRAFFIC_ARTERIAL_CLOSURE">Arterial Road Closure</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Synthesizing Multilingual Alerts via Gemini...' : 'Synthesize Multilingual Emergency Advisories'}</span>
            </button>
          </div>

          {/* Broadcast Output Display */}
          {broadcastData && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>Localized Output Matrix</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Ready for Cellular Push & Public Sirens
                </span>
              </div>

              {/* Multilingual Cards */}
              <div className="space-y-2.5">
                {Object.entries(broadcastData.generated_alerts).map(([lang, message]) => (
                  <div
                    key={lang}
                    className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">
                        {lang}
                      </span>
                      <button
                        onClick={() => copyToClipboard(message, lang)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLang === lang ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">
                      {message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Designated Evacuation Corridor */}
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-2.5">
                <Navigation className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                    Public Evacuation Corridor
                  </span>
                  <p className="text-slate-300 text-xs">
                    {broadcastData.evacuation_corridor}
                  </p>
                </div>
              </div>

              {/* Channels Notified */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                <span className="text-slate-500">Distribution:</span>
                {broadcastData.channels_notified.map((ch, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {ch}
                  </span>
                ))}
              </div>

              {/* Transmit Action */}
              <div className="pt-2">
                {transmitted ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-center font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>EMERGENCY BROADCAST SUCCESSFULLY TRANSMITTED ACROSS ALL CHANNELS</span>
                  </div>
                ) : (
                  <button
                    onClick={handleTransmitBroadcast}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-red transition transform active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Authorize & Broadcast Emergency Alert Now</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
