import React, { useState, useEffect } from 'react';
import { GovernmentUser, GovernmentRole } from '../types';
import { 
  ShieldCheck, X, Building2, Flame, HeartPulse, Shield, 
  Radio, CheckCircle2, Lock, UserCheck, KeyRound, AlertCircle, ArrowRight
} from 'lucide-react';

interface GovernmentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GovernmentUser | null;
  onLogin: (user: GovernmentUser) => void;
  onLogout: () => void;
}

const PRESET_GOV_ROLES: Array<{
  role: GovernmentRole;
  title: string;
  agency: string;
  badgeNumber: string;
  name: string;
  unitId?: string;
  hospitalId?: string;
  clearanceLevel: string;
  icon: any;
  colorTheme: string;
  borderTheme: string;
  bgTheme: string;
  description: string;
}> = [
  {
    role: 'AMBULANCE_DRIVER',
    title: 'Emergency Medical Technician / Driver',
    agency: 'Metropolitan Paramedic & Trauma Services',
    badgeNumber: 'EMS-DRV-104',
    name: 'Officer Dan Morales',
    unitId: 'AMB-01',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_1_PARAMEDIC',
    icon: HeartPulse,
    colorTheme: 'text-rose-400',
    borderTheme: 'border-rose-500/40 hover:border-rose-400',
    bgTheme: 'bg-rose-500/10 hover:bg-rose-500/20',
    description: 'Direct Green Corridor priority signal override, Trauma ER telemetry sync'
  },
  {
    role: 'FIRE_OFFICER',
    title: 'Battalion Rescue Chief',
    agency: 'Metro Fire Department — HAZMAT Division',
    badgeNumber: 'FD-CHIEF-12',
    name: 'Chief Sarah Jenkins',
    unitId: 'FIRE-01',
    clearanceLevel: 'LEVEL_3_COMMAND',
    icon: Flame,
    colorTheme: 'text-amber-400',
    borderTheme: 'border-amber-500/40 hover:border-amber-400',
    bgTheme: 'bg-amber-500/10 hover:bg-amber-500/20',
    description: 'Industrial foam authorization, thermal drone aerial recon deployment'
  },
  {
    role: 'POLICE_OFFICER',
    title: 'Transit & Highway Patrol Supervisor',
    agency: 'Urban Law Enforcement — Precinct 4',
    badgeNumber: 'PD-TAC-09',
    name: 'Sgt. Alex Thorne',
    unitId: 'POL-02',
    clearanceLevel: 'LEVEL_2_TACTICAL',
    icon: Shield,
    colorTheme: 'text-blue-400',
    borderTheme: 'border-blue-500/40 hover:border-blue-400',
    bgTheme: 'bg-blue-500/10 hover:bg-blue-500/20',
    description: 'Arterial roadblock lockouts, perimeter evacuation control'
  },
  {
    role: 'HOSPITAL_TRAUMA_CHIEF',
    title: 'Emergency Trauma & Surgical Directorate',
    agency: 'Zuckerberg Metro General & Trauma Center',
    badgeNumber: 'MD-TRAUMA-01',
    name: 'Dr. Elena Rostova, MD',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_3_COMMAND',
    icon: Building2,
    colorTheme: 'text-emerald-400',
    borderTheme: 'border-emerald-500/40 hover:border-emerald-400',
    bgTheme: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    description: 'Trauma Resuscitation Bay clearance, on-call surgical team mobilization'
  },
  {
    role: 'CITY_DISPATCH_OPERATOR',
    title: 'Emergency Operations Command Director',
    agency: 'Department of Municipal Emergency Management',
    badgeNumber: 'GOV-ROOT-911',
    name: 'Director Marcus Sterling',
    clearanceLevel: 'LEVEL_4_CHIEF',
    icon: Radio,
    colorTheme: 'text-cyan-400',
    borderTheme: 'border-cyan-500/40 hover:border-cyan-400',
    bgTheme: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    description: 'Citywide resilience scoring, multilingual broadcast authorization'
  }
];

export const GovernmentLoginModal: React.FC<GovernmentLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [customBadge, setCustomBadge] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<GovernmentRole>('AMBULANCE_DRIVER');
  const [customPin, setCustomPin] = useState('');

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

  const handleSelectPreset = (preset: typeof PRESET_GOV_ROLES[0]) => {
    const user: GovernmentUser = {
      id: `usr-${preset.badgeNumber.toLowerCase()}`,
      badgeNumber: preset.badgeNumber,
      fullName: preset.name,
      role: preset.role,
      roleTitle: preset.title,
      agencyName: preset.agency,
      callsign: preset.unitId,
      assignedUnitId: preset.unitId,
      assignedHospitalId: preset.hospitalId,
      clearanceLevel: preset.clearanceLevel,
      loggedAt: new Date().toISOString()
    };
    onLogin(user);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBadge.trim() || !customName.trim()) return;

    const matchedPreset = PRESET_GOV_ROLES.find(p => p.role === customRole) || PRESET_GOV_ROLES[0];
    const user: GovernmentUser = {
      id: `usr-${Date.now()}`,
      badgeNumber: customBadge.trim().toUpperCase(),
      fullName: customName.trim(),
      role: customRole,
      roleTitle: matchedPreset.title,
      agencyName: matchedPreset.agency,
      assignedUnitId: matchedPreset.unitId,
      assignedHospitalId: matchedPreset.hospitalId,
      clearanceLevel: matchedPreset.clearanceLevel,
      loggedAt: new Date().toISOString()
    };
    onLogin(user);
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-neon-blue">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide font-mono">
                  GOVERNMENT & FIRST RESPONDER ACCESS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OPTIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official authorization for Ambulance Drivers, Fire, Police, & Trauma Hospitals
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

        {/* Informative Note: Citizen vs Gov */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-3 font-mono text-xs text-cyan-200">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Public Citizens Do Not Need To Log In.</strong> Emergency SOS intake, accident photo snapping, and public alerts are open to everyone without an account.
          </span>
        </div>

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="p-6 space-y-6">
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
                    Active Session Authenticated
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.clearanceLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Officer / Personnel</span>
                  <p className="text-white font-bold text-sm">{currentUser.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Official Badge ID</span>
                  <p className="text-cyan-300 font-bold text-sm">{currentUser.badgeNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Role / Assignment</span>
                  <p className="text-slate-200 font-semibold">{currentUser.roleTitle}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Agency</span>
                  <p className="text-slate-300">{currentUser.agencyName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-mono text-xs transition"
              >
                Close & Return
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/50 text-rose-200 font-mono text-xs font-bold transition active:scale-95 shadow-md"
              >
                Sign Out & Return to Citizen Mode
              </button>
            </div>
          </div>
        ) : (
          /* Login Tabs */
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveTab('quick')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'quick'
                    ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 shadow-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>1-Click Verified Role Profiles</span>
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'custom'
                    ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 shadow-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Custom Badge Sign-In</span>
              </button>
            </div>

            {activeTab === 'quick' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-mono">
                  Select an official role below to authenticate instantly with emergency privileges:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {PRESET_GOV_ROLES.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.role}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full text-left p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${preset.bgTheme} ${preset.borderTheme}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl bg-black/40 border border-white/10 ${preset.colorTheme}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition">
                                {preset.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/10 text-slate-300">
                                {preset.badgeNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono font-semibold mt-0.5">
                              {preset.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pr-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                            <span>Authorize</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Badge Form */
              <form onSubmit={handleCustomSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                    Agency Department / Branch
                  </label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as GovernmentRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  >
                    <option value="AMBULANCE_DRIVER" className="bg-slate-900 text-white">
                      🚑 Ambulance / Paramedic Transit Unit
                    </option>
                    <option value="FIRE_OFFICER" className="bg-slate-900 text-white">
                      🚒 Fire & Rescue Service (HAZMAT)
                    </option>
                    <option value="POLICE_OFFICER" className="bg-slate-900 text-white">
                      🚓 Police Tactical & Transit Patrol
                    </option>
                    <option value="HOSPITAL_TRAUMA_CHIEF" className="bg-slate-900 text-white">
                      🏥 Receiving Trauma Hospital ER Staff
                    </option>
                    <option value="CITY_DISPATCH_OPERATOR" className="bg-slate-900 text-white">
                      🏢 911 Municipal Dispatch Headquarters
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                      Officer Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Officer Marcus Rivera"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                      Government Badge ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMS-9481"
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                    Security Passcode / PIN (Demo: any 4 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-neon-blue transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Credentials & Sign In</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
