import React, { useState } from 'react';
import { IncidentCreatePayload, Incident } from '../types';
import { api } from '../services/api';
import { 
  X, AlertTriangle, Send, Sparkles, MapPin, Phone, User, 
  Flame, Droplets, Building, HeartPulse, Camera
} from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (incident: Incident) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState<string>('');
  const [callerName, setCallerName] = useState<string>('Aarav Sharma (Resident)');
  const [callerPhone, setCallerPhone] = useState<string>('+91 98450 11200');
  const [address, setAddress] = useState<string>('Silk Board Flyover Ramp, Hosur Rd & ORR');
  const [lat, setLat] = useState<number>(12.9180);
  const [lng, setLng] = useState<number>(77.6240);
  const [description, setDescription] = useState<string>('');
  const [hasImage, setHasImage] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Preset emergency scenarios for seamless demonstration
  const scenarios = [
    {
      name: 'Hazardous Chemical Fire',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      title: 'Solvent Warehouse Blaze & Toxic Plume',
      addr: 'Whitefield Industrial Export Zone, Phase II',
      lat: 12.9720,
      lng: 77.7150,
      desc: 'Solvents ignited in warehouse barrel bay. Heavy acrid smoke drifting toward residential IT township. Two factory technicians unaccounted for.'
    },
    {
      name: 'Monsoon Underpass Flood',
      icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
      title: 'Bellandur Arterial Underpass Monsoon Inundation',
      addr: 'Bellandur Outer Ring Road Subterranean Underpass',
      lat: 12.9360,
      lng: 77.6730,
      desc: 'Monsoon cloudburst flooded the underpass 2.1 meters high. BMTC city bus stalled with passengers stranded on vehicle roof.'
    },
    {
      name: 'Structural Facade Collapse',
      icon: <Building className="w-3.5 h-3.5 text-amber-400" />,
      title: 'Brigade Road Commercial Enclave Balcony Collapse',
      addr: 'Brigade Towers, 135 Brigade Rd, Central CBD',
      lat: 12.9730,
      lng: 77.6080,
      desc: 'Concrete sunshade & glass facade collapsed onto pedestrian pavement during evening rush hour. Two pedestrians pinned under rubble.'
    },
    {
      name: 'Acute Cardiac Emergency',
      icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />,
      title: 'Majestic Metro Interchange Commuter Collapse',
      addr: 'Kempegowda Majestic Metro Concourse Platform',
      lat: 12.9780,
      lng: 77.5720,
      desc: 'Elderly commuter collapsed near turnstiles, no pulse detected, bystander CPR in progress. 108 ALS Ambulance & defibrillator requested.'
    }
  ];

  const applyScenario = (sc: typeof scenarios[0]) => {
    setTitle(sc.title);
    setAddress(sc.addr);
    setLat(sc.lat);
    setLng(sc.lng);
    setDescription(sc.desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please provide an incident description or select a preset scenario.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: IncidentCreatePayload = {
        title: title || 'Emergency Distress Call',
        caller_name: callerName,
        caller_phone: callerPhone,
        raw_description: description,
        location_address: address,
        coordinates: { lat, lng },
        image_base64: hasImage ? 'data:image/jpeg;base64,simulated_multimodal_scene_capture' : null
      };

      const newInc = await api.createIncident(payload);
      onCreated(newInc);
      onClose();
    } catch (err) {
      alert(`Submission failed: ${err}`);
    } finally {
      setSubmitting(false);
    }
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
        className="relative w-full max-w-2xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-modal-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3 font-mono">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-neon-red">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Citizen 911 / Emergency SOS Intake
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Direct Dispatch Ingestion with Automated Gemini 3.8 Flash Triage
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {/* Quick Scenario Preset Chips */}
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block mb-2">
              ⚡ Quick 1-Click Demo Scenarios:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((sc, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyScenario(sc)}
                  className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center gap-2 group"
                >
                  {sc.icon}
                  <div className="truncate">
                    <span className="block text-slate-200 group-hover:text-cyan-300 font-bold truncate">
                      {sc.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {sc.addr}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Incident Headline / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Structure Fire on Pier 38"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Caller Name</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Caller Phone / Terminal</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Location Address / Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Raw 911 Distress Call or Citizen Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe active flames, smoke density, trapped individuals, water level, chemical smells..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Simulated Multimodal Photo Capture */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-slate-200 font-bold block">Attach Multimodal Disaster Image</span>
                  <span className="text-[10px] text-slate-500">
                    Sends visual scene to Gemini for computer vision hazard verification
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasImage}
                onChange={() => setHasImage(!hasImage)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 shadow-neon-blue transition transform active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
              <span>
                {submitting ? 'Running Gemini 3.8 Flash Multimodal Triage...' : 'Submit & Execute AI Autonomous Triage'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
