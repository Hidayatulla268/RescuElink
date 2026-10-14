import React, { useState, useRef } from 'react';
import { IncidentCreatePayload, Incident } from '../types';
import { api } from '../services/api';
import { 
  X, AlertTriangle, Send, Sparkles, MapPin, Phone, User, 
  Flame, Droplets, Building, HeartPulse, Camera, Crosshair, 
  Upload, Trash2, CheckCircle2, ShieldAlert
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
  const [callerName, setCallerName] = useState<string>('');
  const [callerPhone, setCallerPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [lat, setLat] = useState<number>(12.9716);
  const [lng, setLng] = useState<number>(77.5946);
  const [category, setCategory] = useState<string>('TRAFFIC_COLLISION');
  const [description, setDescription] = useState<string>('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Standard emergency classification templates
  const templates = [
    {
      name: 'Hazardous Chemical Fire',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      cat: 'FIRE_EXPLOSION',
      title: 'Industrial Chemical Blaze & Smoke Plume',
      desc: 'Flammable solvents ignited in warehouse bay. Heavy toxic smoke spreading toward adjacent streets. Potential victims trapped.'
    },
    {
      name: 'Monsoon Underpass Flood',
      icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
      cat: 'FLOOD_WATER',
      title: 'Arterial Underpass Monsoon Flash Flood',
      desc: 'Torrential rain flooded underpass over 1.8 meters high. Commuter vehicles submerged with passengers stranded on vehicle roofs.'
    },
    {
      name: 'Structural Collapse',
      icon: <Building className="w-3.5 h-3.5 text-amber-400" />,
      cat: 'STRUCTURAL_COLLAPSE',
      title: 'Commercial Complex Balcony / Facade Collapse',
      desc: 'Load-bearing concrete balcony collapsed onto street pavement. Heavy rubble blocking road, pedestrians trapped underneath.'
    },
    {
      name: 'Critical Cardiac / Trauma',
      icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />,
      cat: 'MEDICAL_TRAUMA',
      title: 'Public Transit Concourse Cardiac Arrest',
      desc: 'Commuter collapsed suddenly, unconscious with no palpable pulse. Immediate bystander CPR in progress, ALS ambulance required.'
    }
  ];

  const handleApplyTemplate = (tmpl: typeof templates[0]) => {
    setTitle(tmpl.title);
    setCategory(tmpl.cat);
    setDescription(tmpl.desc);
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4))
        };
        setLat(coords.lat);
        setLng(coords.lng);
        setAddress(`GPS: ${coords.lat}° N, ${coords.lng}° E (Accurate within ${Math.round(pos.coords.accuracy)}m)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not access GPS location. Please enter your street address.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe the emergency incident.');
      return;
    }
    if (!address.trim()) {
      alert('Please provide the incident location address or use GPS.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: IncidentCreatePayload = {
        title: title.trim() || `Emergency Report (${category.replace('_', ' ')})`,
        caller_name: isAnonymous ? 'Anonymous Citizen' : (callerName.trim() || 'Good Samaritan Citizen'),
        caller_phone: isAnonymous ? 'Unlisted' : (callerPhone.trim() || '+91 112 Intake'),
        raw_description: description.trim(),
        location_address: address.trim(),
        coordinates: { lat, lng },
        image_base64: imageSrc || null
      };

      const newInc = await api.createIncident(payload);
      onCreated(newInc);
      onClose();
    } catch (err) {
      alert(`Incident submission failed: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto max-h-[92vh] font-mono animate-modal-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-neon-red">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Emergency Distress Intake — 112 / 108 Emergency Grid
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Official Incident Reporting & Autonomous AI Multimodal Triage
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* Quick Incident Templates */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
              Standard Incident Classification Templates (Optional):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-left transition flex items-center gap-2.5"
                >
                  <span className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
                    {tmpl.icon}
                  </span>
                  <div className="overflow-hidden">
                    <span className="font-bold text-white block text-[11px] truncate">{tmpl.name}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{tmpl.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Incident Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-bold block text-[11px]">Emergency Incident Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Multi-Vehicle Collision at Silk Board Flyover"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block text-[11px]">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
              >
                <option value="TRAFFIC_COLLISION">🚗 Traffic Collision</option>
                <option value="FIRE_EXPLOSION">🔥 Fire & Explosion</option>
                <option value="MEDICAL_TRAUMA">🚑 Medical & Trauma</option>
                <option value="FLOOD_WATER">🌊 Monsoon Flood</option>
                <option value="STRUCTURAL_COLLAPSE">🏢 Structural Damage</option>
                <option value="HAZMAT_SPILL">☣️ Hazmat Spill</option>
                <option value="CIVIL_SAFETY">⚠️ Civil Safety</option>
              </select>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Incident Street Location Address</span>
              </label>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={isLocating}
                className="text-[10px] text-cyan-300 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-1 transition active:scale-95"
              >
                <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : '📍 Use Live GPS'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Outer Ring Road near Sony World Junction, Koramangala, Bengaluru"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Caller Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 mb-1 block font-bold text-[11px] flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Caller / Reporter Full Name</span>
              </label>
              <input
                type="text"
                disabled={isAnonymous}
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder={isAnonymous ? 'Protected Anonymous Report' : 'e.g. Ramesh Kumar'}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 mb-1 block font-bold text-[11px] flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Contact Phone Number</span>
              </label>
              <input
                type="text"
                disabled={isAnonymous}
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder={isAnonymous ? 'Unlisted' : '+91 98450 XXXXX'}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonCheck"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="anonCheck" className="text-[11px] text-slate-300 select-none cursor-pointer">
              Protect My Identity (Protected Under Good Samaritan Law - Sec 134A MV Act)
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-300 font-bold block mb-1 text-[11px]">
              Detailed Description of Emergency Scene
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, number of victims, active hazards (fire, power lines, fuel leak), and landmarks..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Photo / Visual Evidence Upload */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Attach Incident Scene Photo (Optional)</span>
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-500/25 transition"
              >
                <Upload className="w-3 h-3" />
                <span>{imageSrc ? 'Change Photo' : 'Select Photo'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {imageSrc && (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-36 flex items-center justify-center bg-black">
                <img src={imageSrc} alt="Preview" className="max-h-36 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-rose-400 hover:text-white border border-rose-500/40"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-neon-blue transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting Distress SOS...' : 'Transmit Emergency Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
