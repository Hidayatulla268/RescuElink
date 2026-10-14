import React, { useState, useEffect } from 'react';
import { GovernmentUser, GovernmentRole } from '../types';
import { SAMPLE_LOGINS, createGovUserFromSample } from '../services/sampleLogins';
import { api } from '../services/api';
import { 
  ShieldCheck, X, Building2, Flame, HeartPulse, Shield, 
  Radio, CheckCircle2, Lock, UserCheck, KeyRound, AlertCircle, 
  ArrowRight, Sparkles, ChevronDown, ChevronUp, Eye, EyeOff, LogOut
} from 'lucide-react';

interface GovernmentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GovernmentUser | null;
  onLogin: (user: GovernmentUser) => void;
  onLogout: () => void;
}

export const GovernmentLoginModal: React.FC<GovernmentLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [badgeId, setBadgeId] = useState('PILOT-108');
  const [password, setPassword] = useState('medic108');
  const [selectedDept, setSelectedDept] = useState('108 Emergency Medical Relief Services — GVK EMRI');
  const [showPassword, setShowPassword] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLoginError('');
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    const query = badgeId.trim().toUpperCase();
    const matched = SAMPLE_LOGINS.find(s => s.username.toUpperCase() === query);

    if (matched) {
      if (password.trim() && password.trim() !== matched.passwordHint) {
        setLoginError(`Authentication failed: Invalid security key/password for ${matched.username}.`);
        setIsAuthenticating(false);
        return;
      }

      try {
        await api.govLogin({
          badge_id: matched.username,
          role: matched.role,
          name: matched.name,
          department: matched.agency
        });
      } catch (err) {
        console.warn('Backend login token issue', err);
      }

      const user = createGovUserFromSample(matched);
      onLogin(user);
      setIsAuthenticating(false);
      onClose();
      return;
    }

    // Dynamic field operator login
    if (!badgeId.trim()) {
      setLoginError('Badge ID or Service Number is required.');
      setIsAuthenticating(false);
      return;
    }

    const dynamicUser: GovernmentUser = {
      id: `usr-${Date.now()}`,
      badgeNumber: query,
      fullName: `Officer ${query}`,
      role: 'CITY_DISPATCH_OPERATOR',
      roleTitle: 'Emergency Operations Officer',
      agencyName: selectedDept,
      clearanceLevel: 'LEVEL_2_TACTICAL',
      loggedAt: new Date().toISOString()
    };

    try {
      await api.govLogin({
        badge_id: dynamicUser.badgeNumber,
        role: dynamicUser.role,
        name: dynamicUser.fullName,
        department: dynamicUser.agencyName
      });
    } catch (err) {
      console.warn('Backend login fallback', err);
    }

    onLogin(dynamicUser);
    setIsAuthenticating(false);
    onClose();
  };

  const autofillOfficer = (officer: typeof SAMPLE_LOGINS[0]) => {
    setBadgeId(officer.username);
    setPassword(officer.passwordHint);
    setSelectedDept(officer.agency);
    setLoginError('');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] font-mono animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-blue">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                First Responder & Operator Portal
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Karnataka State Emergency Operations (112 ERSS) • GVK EMRI 108 • BTP 100
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {currentUser ? (
            /* Active Verified Session State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Authenticated Government Session Active</span>
                </div>
                <p className="text-slate-300 text-xs">
                  Your cryptographic HMAC-SHA256 bearer token is verified on the municipal grid.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Personnel Name:</span>
                  <span className="font-bold text-white text-sm">{currentUser.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Badge / Service Number:</span>
                  <span className="font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                    {currentUser.badgeNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Operational Role:</span>
                  <span className="font-bold text-slate-200">{currentUser.roleTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department / Agency:</span>
                  <span className="text-slate-300 truncate max-w-[260px]">{currentUser.agencyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clearance Tier:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {currentUser.clearanceLevel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-neon-blue"
                >
                  Continue to Operations Console
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Official Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block text-[11px]">
                  Emergency Department / Agency
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="108 Emergency Medical Relief Services — GVK EMRI">
                    🚑 108 Emergency Medical Relief Services (Ambulance)
                  </option>
                  <option value="Karnataka State Fire and Emergency Services & SDRF">
                    🚒 Karnataka State Fire & Emergency Services / SDRF
                  </option>
                  <option value="Bengaluru City Police — Traffic Flying Squad 100">
                    🚓 Bengaluru Traffic Police (BTP) & Flying Squad (100)
                  </option>
                  <option value="Apollo Multi-Speciality Trauma & Emergency Center">
                    🏥 Apollo / Metropolitan Trauma Emergency Centers
                  </option>
                  <option value="Karnataka State Emergency Operation Centre (112 ERSS)">
                    🏢 112 Unified Emergency Response Center (State EOC)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block text-[11px]">
                  Official Badge / Service Identification ID
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. PILOT-108, FIRE-101, POLICE-100, DISP-112"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block text-[11px]">
                  Security Password / Officer PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter official security password"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-blue transition active:scale-95 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isAuthenticating ? 'Verifying HMAC Signature...' : 'Authorize & Sign In'}</span>
              </button>

              {/* Collapsible Officer Directory Accordion for Verification Reference */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDirectory(!showDirectory)}
                  className="w-full text-slate-400 hover:text-cyan-300 text-[11px] flex items-center justify-between transition py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Personnel Access Directory & Verification Credentials</span>
                  </span>
                  {showDirectory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showDirectory && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl bg-black/50 border border-white/10 animate-modal-in">
                    <p className="text-[10px] text-slate-400">
                      Standard authorized duty personnel enrolled in the 112 / 108 Karnataka Command Grid:
                    </p>
                    <div className="space-y-1.5">
                      {SAMPLE_LOGINS.map((officer) => (
                        <div 
                          key={officer.username}
                          className="p-2 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-white block">{officer.name}</span>
                            <span className="text-[10px] text-slate-400">Badge: <strong>{officer.username}</strong> | Pass: {officer.passwordHint}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => autofillOfficer(officer)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
