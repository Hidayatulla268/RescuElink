import React, { useState, useEffect } from 'react';
import { GovernmentUser, GovernmentRole } from '../types';
import { SAMPLE_LOGINS, createGovUserFromSample } from '../services/sampleLogins';
import { api } from '../services/api';
import { 
  ShieldCheck, X, Building2, Flame, HeartPulse, Shield, 
  Radio, CheckCircle2, Lock, UserCheck, KeyRound, AlertCircle, ArrowRight, Sparkles
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
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [customBadge, setCustomBadge] = useState('');
  const [customPassword, setCustomPassword] = useState('');
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

  const handleSelectSample = async (sample: typeof SAMPLE_LOGINS[0]) => {
    try {
      await api.govLogin({
        badge_id: sample.username,
        role: sample.role,
        name: sample.name,
        department: sample.agency
      });
    } catch (e) {
      console.warn('Backend login token issue, falling back to local session', e);
    }
    const user = createGovUserFromSample(sample);
    onLogin(user);
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const query = customBadge.trim().toUpperCase();

    // Check if matches any sample login username
    const matched = SAMPLE_LOGINS.find(s => s.username.toUpperCase() === query);
    if (matched) {
      if (customPassword.trim() && customPassword.trim() !== matched.passwordHint) {
        setLoginError(`Incorrect password. (Hint for ${matched.username}: ${matched.passwordHint})`);
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
      onLogin(createGovUserFromSample(matched));
      onClose();
      return;
    }

    // Fallback: create dynamic official profile
    if (!customBadge.trim()) return;
    const user: GovernmentUser = {
      id: `usr-${Date.now()}`,
      badgeNumber: customBadge.trim().toUpperCase(),
      fullName: `Officer ${customBadge.trim().toUpperCase()}`,
      role: 'AMBULANCE_DRIVER',
      roleTitle: 'Emergency Field Specialist',
      agencyName: 'Municipal Emergency Response Division',
      clearanceLevel: 'LEVEL_1_PARAMEDIC',
      loggedAt: new Date().toISOString()
    };
    try {
      await api.govLogin({
        badge_id: user.badgeNumber,
        role: user.role,
        name: user.fullName,
        department: user.agencyName
      });
    } catch (err) {
      console.warn('Backend login token issue', err);
    }
    onLogin(user);
    onClose();
  };

  const getRoleIcon = (role: GovernmentRole) => {
    switch (role) {
      case 'AMBULANCE_DRIVER': return HeartPulse;
      case 'FIRE_OFFICER': return Flame;
      case 'POLICE_OFFICER': return Shield;
      case 'HOSPITAL_TRAUMA_CHIEF': return Building2;
      case 'CITY_DISPATCH_OPERATOR': return Radio;
    }
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
                Authorized Login for 108 Ambulance Pilots, Fire 101, Police 100, Hospitals & 112 Dispatch
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
            <strong>No Login Needed for Normal Citizens.</strong> Emergency reporting, accident photo SOS, and route alerts are completely open to the public without signing in.
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
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Sample Logins for Testing (1-Click)</span>
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
                <span>Manual Badge & Password</span>
              </button>
            </div>

            {activeTab === 'quick' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-mono">
                    Select any sample role below to sign in instantly with test credentials:
                  </p>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                    5 Sample Roles Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {SAMPLE_LOGINS.map((sample) => {
                    const Icon = getRoleIcon(sample.role);
                    return (
                      <div
                        key={sample.username}
                        className={`p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${sample.bgTheme} ${sample.borderTheme}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl bg-black/50 border border-white/10 mt-0.5 ${sample.colorTheme}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white">
                                {sample.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 border border-white/15 text-cyan-300 font-bold">
                                ID: {sample.username}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-slate-400">
                                Pass: {sample.passwordHint}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono font-semibold mt-0.5">
                              {sample.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {sample.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectSample(sample)}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-neon-blue transition active:scale-95 shrink-0"
                        >
                          <span>Sign In as {sample.username}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Login Form with Sample Helper */
              <form onSubmit={handleCustomSubmit} className="space-y-4 font-mono text-xs">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                    {loginError}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px] text-slate-400">
                  <span className="text-cyan-400 font-bold uppercase block text-[10px]">
                    Quick Sample Login Credentials to Test:
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div>🚑 Ambulance: <code className="text-white">AMB-104</code> / <code className="text-emerald-400">medic123</code></div>
                    <div>🚒 Fire Chief: <code className="text-white">FIRE-01</code> / <code className="text-emerald-400">fire911</code></div>
                    <div>🚓 Police: <code className="text-white">POL-02</code> / <code className="text-emerald-400">police77</code></div>
                    <div>🏥 Hospital: <code className="text-white">HOSP-01</code> / <code className="text-emerald-400">traumaER</code></div>
                    <div>🏢 911 Dispatch: <code className="text-white">DISP-01</code> / <code className="text-emerald-400">admin911</code></div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                    Official Badge ID / Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AMB-104 or FIRE-01"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
                    Security Passcode / Password
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. medic123 or fire911"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-neon-blue transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticate Credentials & Sign In</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
