import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, Bell, Volume2, VolumeX, 
  PlusCircle, Radio, Clock, MapPin, Zap, Camera 
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics';
  setActiveTab: (tab: 'command' | 'map' | 'corridor' | 'sensors' | 'analytics') => void;
  onOpenNewIncident: () => void;
  onOpenSnapAccident: () => void;
  activeP1Count: number;
  totalActiveCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
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
    <header className="sticky top-0 z-40 bg-command-panel/90 backdrop-blur-md border-b border-command-border px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 shadow-neon-blue">
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
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Autonomous Urban Dispatch Command</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Gemini 3.8 Flash
                </span>
              </p>
            </div>
          </div>

          {/* Incident Status Pill */}
          <div className="flex items-center gap-2">
            {activeP1Count > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-mono animate-pulse shadow-neon-red">
                <Radio className="w-3.5 h-3.5" />
                <span>{activeP1Count} P1 CRITICAL</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{totalActiveCount} Active Incidents</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-command-bg/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'command'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Command Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('corridor')}
            className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'corridor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Green Corridor AI</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Tactical GIS Map</span>
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'sensors'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>IoT Sensors</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Resilience</span>
          </button>
        </nav>

        {/* Right Actions: Clock, Sound Toggle, Report SOS */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00 UTC'}</span>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Alarm sounds active' : 'Alarms muted'}
            className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onOpenSnapAccident}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-mono text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-neon-amber transition transform active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 SNAP ACCIDENT SOS</span>
          </button>

          <button
            onClick={onOpenNewIncident}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-neon-red transition transform active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ CITIZEN 911</span>
          </button>
        </div>
      </div>
    </header>
  );
};
