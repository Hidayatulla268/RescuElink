import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, Bell, Volume2, VolumeX, 
  PlusCircle, Radio, Clock, MapPin, Zap, Camera, Monitor, Smartphone, 
  ShieldCheck, LogIn, UserCheck, Home, ArrowLeft, HelpCircle,
  PhoneCall, HeartPulse, Compass
} from 'lucide-react';
import { GovernmentUser, ViewMode } from '../types';
import { QuickGuideModal } from './QuickGuideModal';

interface NavbarProps {
  activeTab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics';
  setActiveTab: (tab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics') => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  governmentUser: GovernmentUser | null;
  isGovView: boolean;
  onOpenGovLogin: () => void;
  onSwitchToCitizenView: () => void;
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
  isGovView,
  onOpenGovLogin,
  onSwitchToCitizenView,
  onOpenNewIncident,
  onOpenSnapAccident,
  activeP1Count: _activeP1Count,
  totalActiveCount: _totalActiveCount
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/65 backdrop-blur-3xl border-b border-white/15 px-3 sm:px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
        <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Left: Brand Identity & Quick Role Indicator */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div 
              onClick={onSwitchToCitizenView}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Return to Public Citizen Homepage"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-white/10 to-emerald-500/20 border border-amber-400/40 shadow-neon-blue transition-transform group-hover:scale-105">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-wider text-white uppercase font-mono flex items-center gap-1.5">
                    <span>RescuE<span className="text-cyan-400">LINK</span></span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                      INDIA 🇮🇳
                    </span>
                  </h1>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {isGovView ? 'Command Hub' : 'Citizen Safety'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span>112 / 108 Smart Emergency Network</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Green Corridors Active
                  </span>
                </p>
              </div>
            </div>

            {/* View Mode Toggle: Desktop vs Mobile View */}
            <div className="flex items-center p-1 rounded-2xl glass-pill font-mono text-xs">
              <button
                onClick={() => setViewMode('web')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
                  viewMode === 'web'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-blue font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
                  viewMode === 'mobile'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-blue font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile Phone View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Middle: Clear & Friendly Navigation Tabs for All Users */}
          {viewMode === 'web' && (
            <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl glass-pill font-mono text-xs shadow-lg">
              {/* Tab 1: Citizen Safety Home */}
              <button
                onClick={onSwitchToCitizenView}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  !isGovView
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-white border border-cyan-400/50 shadow-neon-blue font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Easy Emergency Safety Portal for Everyday Citizens"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span>👥 Citizen Portal</span>
              </button>

              {/* Tab 2: 108 Green Corridor & Driver Routes */}
              <button
                onClick={() => {
                  if (!isGovView) {
                    onOpenGovLogin(); // or allow preview
                  }
                  setActiveTab('corridor');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isGovView && activeTab === 'corridor'
                    ? 'bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-emerald-200 border border-emerald-400/50 shadow-neon-green font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Shortest Hospital Routes & Automated Green Traffic Signals"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>🚑 108 Corridor & Routes</span>
              </button>

              {/* Tab 3: Interactive Radar Map */}
              <button
                onClick={() => {
                  if (!isGovView) {
                    onOpenGovLogin();
                  }
                  setActiveTab('map');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isGovView && activeTab === 'map'
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-400/50 shadow-neon-blue font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Full-Screen Interactive Traffic & Emergency Map"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>🗺️ Live Radar Map</span>
              </button>

              {/* Tab 4: 112 Command Dispatch */}
              <button
                onClick={() => {
                  if (!isGovView) {
                    onOpenGovLogin();
                  }
                  setActiveTab('command');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isGovView && activeTab === 'command'
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-600/30 text-indigo-200 border border-indigo-400/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Official 112 / 108 City Incident Dispatch Hub"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>🛡️ 112 Command Hub</span>
              </button>
            </nav>
          )}

          {/* Right: Quick Action SOS Buttons & Help Guide */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            
            {/* Friendly "How It Works" Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl glass-button-glow text-cyan-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition active:scale-95"
              title="Click for a simple 3-step explanation of how RescuELINK works"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>How It Works</span>
            </button>

            {/* Officer Login / Authenticated Status */}
            {governmentUser ? (
              <button
                onClick={onOpenGovLogin}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 shadow-neon-green transition active:scale-95"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">{governmentUser.fullName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 border border-emerald-400/30 text-emerald-200">
                  {governmentUser.badgeNumber}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenGovLogin}
                className="px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Official Portal Login for EMS Pilots, Police, Fire, and Doctors"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Officer Login</span>
              </button>
            )}

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Emergency sound telemetry active' : 'Sound muted'}
              className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white transition"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Quick Citizen Photo SOS Button */}
            <button
              onClick={onOpenSnapAccident}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-amber transition transform active:scale-95 animate-pulse"
              title="Take a photo of a road accident for instant AI verification and ambulance dispatch"
            >
              <Camera className="w-4 h-4" />
              <span>📸 SNAP SOS</span>
            </button>

            {/* Emergency Report Button */}
            <button
              onClick={onOpenNewIncident}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-neon-red transition transform active:scale-95"
              title="Call or report a medical, fire, or police emergency"
            >
              <PlusCircle className="w-4 h-4" />
              <span>🚨 Report Emergency</span>
            </button>

          </div>

        </div>
      </header>

      {/* Easy-To-Understand Quick Guide Modal */}
      <QuickGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenSnapAccident={onOpenSnapAccident}
        onOpenNewIncident={onOpenNewIncident}
      />
    </>
  );
};
