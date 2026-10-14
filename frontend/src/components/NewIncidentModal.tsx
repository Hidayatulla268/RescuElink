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
  const [callerName, setCallerName] = useState<string>('Jane Doe (Resident)');
  const [callerPhone, setCallerPhone] = useState<string>('+1 (415) 555-0988');
  const [address, setAddress] = useState<string>('Market St & 5th St, Metro Core');
  const [lat, setLat] = useState<number>(37.7840);
  const [lng, setLng] = useState<number>(-122.4080);
  const [description, setDescription] = useState<string>('');
  const [hasImage, setHasImage] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Preset emergency scenarios for seamless demonstration
  const scenarios = [
    {
      name: 'Hazardous Chemical Fire',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      title: 'Solvent Warehouse Blaze & Plume Formation',
      addr: 'Pier 38 Bulk Terminal, South Pier',
      lat: 37.7830,
      lng: -122.3890,
      desc: 'Solvents ignited in warehouse barrel bay. Heavy acrid orange smoke drifting toward residential apartments. Worker trapped on catwalk.'
    },
    {
      name: 'Flash Flood Vehicle Inundation',
      icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
      title: 'Arterial Underpass Flood with Submerged Bus',
      addr: 'Cesar Chavez Subway Underpass',
      lat: 37.7510,
      lng: -122.4060,
      desc: 'Torrential storm runoff has flooded the underpass 1.8 meters high. City transit bus stalled with 6 elderly passengers unable to evacuate.'
    },
    {
      name: 'Structural Balcony Collapse',
      icon: <Building className="w-3.5 h-3.5 text-amber-400" />,
      title: 'Historic Masonry Facade & Balcony Collapse',
      addr: '420 Montgomery St, Financial District',
      lat: 37.7925,
      lng: -122.4030,
      desc: 'Three-story concrete balcony collapsed onto pedestrian sidewalk during morning rush hour. Two pedestrians pinned under rubble.'
    },
    {
      name: 'Acute Cardiac Collapse',
      icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />,
      title: 'Transit Station Unresponsive Civilian',
      addr: 'Powell St BART Concourse Platform',
      lat: 37.7845,
      lng: -122.4070,
      desc: 'Commuter collapsed near turnstiles, no pulse detected, bystander initiating chest compressions. Automated external defibrillator requested.'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-command-panel border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5 font-mono">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Citizen 911 / Emergency SOS Intake
              </h2>
              <p className="text-[11px] text-slate-400">
                Direct Dispatch Ingestion with Automated Gemini 3.8 Flash Triage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
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
