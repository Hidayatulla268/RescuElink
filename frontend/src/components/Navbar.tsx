import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, Bell, Volume2, VolumeX, 
  PlusCircle, Radio, Clock, MapPin, Zap, Camera, Monitor, Smartphone, 
  ShieldCheck, LogIn, UserCheck 
} from 'lucide-react';
import { GovernmentUser, ViewMode } from '../types';

interface NavbarProps {
  activeTab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics';
  setActiveTab: (tab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics') => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  governmentUser: GovernmentUser | null;
  onOpenGovLogin: () => void;
  onOpenNewIncident: () => void;
  onOpenSnapAccident: () => void;
  activeP1Count: number;
  totalActiveCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  governmentUser,
  onOpenGovLogin,
  onOpenNewIncident,
  onOpenSnapAccident,
  activeP1Count,
  totalActiveCount
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 px-4 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-neon-blue">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wider text-white uppercase font-mono">
                  RescuE<span className="text-cyan-400">LINK</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  AI v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Autonomous Urban Command</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Gemini 3.8 Flash
                </span>
              </p>
            </div>
          </div>

          {/* Form Switcher: Web vs Mobile App */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
            <button
              onClick={() => setViewMode('web')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
                viewMode === 'web'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop Command Center Form"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Console</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
                viewMode === 'mobile'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Smartphone / Mobile App Form"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile App</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Available in Web View) */}
        {viewMode === 'web' && (
          <nav className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 text-xs font-mono backdrop-blur-md">
            <button
              onClick={() => setActiveTab('command')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'command'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Command Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('corridor')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'corridor'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-neon-green font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Green Corridor AI</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Tactical GIS Map</span>
            </button>
            <button
              onClick={() => setActiveTab('sensors')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'sensors'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>IoT Sensors</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-neon-blue font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Resilience</span>
            </button>
          </nav>
        )}

        {/* Right Actions: Gov Login, Citizen SOS, Sound Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Government Login / Status Button */}
          {governmentUser ? (
            <button
              onClick={onOpenGovLogin}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 shadow-neon-green transition active:scale-95"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">{governmentUser.fullName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 border border-emerald-400/30 text-emerald-200">
                {governmentUser.badgeNumber}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenGovLogin}
              className="px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Official authorization for Ambulance, Fire, Police, Hospitals (Optional)"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Gov Login</span>
              <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                Optional
              </span>
            </button>
          )}

          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00 UTC'}</span>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Alarm telemetry active' : 'Alarms muted'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Quick SOS Snap */}
          <button
            onClick={onOpenSnapAccident}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-amber transition transform active:scale-95 animate-pulse"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">📸 SNAP ACCIDENT SOS</span>
            <span className="sm:hidden">📸 SOS</span>
          </button>

          {/* Citizen 911 Report */}
          <button
            onClick={onOpenNewIncident}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-red transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ 911 CALL</span>
          </button>
        </div>

      </div>
    </header>
  );
};
