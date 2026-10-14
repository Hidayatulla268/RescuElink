import React, { useState } from 'react';
import { 
  Incident, PriorityLevel, IncidentStatus 
} from '../types';
import { 
  AlertCircle, Clock, MapPin, Users, ShieldAlert, 
  Search, Filter, ChevronRight, CheckCircle2, Flame, Droplets, HeartPulse
} from 'lucide-react';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onOpenNewIncident: () => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenNewIncident
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIncidents = incidents.filter(inc => {
    // Priority filter
    if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === 'ACTIVE' && (inc.status === 'RESOLVED' || inc.status === 'CANCELLED')) {
      return false;
    }
    if (statusFilter === 'RESOLVED' && inc.status !== 'RESOLVED') {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchAddr = inc.location_address.toLowerCase().includes(q);
      const matchDesc = inc.raw_description.toLowerCase().includes(q);
      const matchHazards = inc.triage?.detected_hazards.some(h => h.toLowerCase().includes(q));
      if (!matchTitle && !matchAddr && !matchDesc && !matchHazards) {
        return false;
      }
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FIRE_EXPLOSION':
      case 'HAZMAT_SPILL':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'FLOOD_WATER':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'MEDICAL_TRAUMA':
        return <HeartPulse className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'P1':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-neon-red';
      case 'P2':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-neon-amber';
      case 'P3':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'P4':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full glass-card-ultra rounded-3xl border border-white/15 backdrop-blur-2xl overflow-hidden shadow-2xl">
      {/* Header & Filter Controls */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-neon-blue"></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Live Incident Dispatch Stream
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15 font-bold">
              {filteredIncidents.length}
            </span>
          </div>
          <button
            onClick={onOpenNewIncident}
            className="text-xs font-mono px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold transition flex items-center gap-1.5 shadow-neon-red active:scale-95"
          >
            <span>+ Report SOS</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search address, hazard, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            {['ALL', 'P1', 'P2', 'P3'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-0.5 rounded transition ${
                  priorityFilter === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
              className={`px-2 py-0.5 rounded transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              {statusFilter === 'ACTIVE' ? 'Active Only' : 'All Statuses'}
            </button>
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredIncidents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <p>No incidents match the active filters.</p>
          </div>
        ) : (
          filteredIncidents.map(inc => {
            const isSelected = selectedIncident?.id === inc.id;
            const isResolved = inc.status === 'RESOLVED';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`group relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-md ${
                  isSelected
                    ? 'glass-card-ultra border-cyan-400 shadow-neon-blue scale-[1.01]'
                    : isResolved
                    ? 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/40 hover:scale-[1.01]'
                }`}
              >
                {/* Header row: Priority + Status + ID */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${getPriorityBadge(inc.priority)}`}>
                      {inc.priority}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inc.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded ${
                      isResolved
                        ? 'bg-slate-800 text-slate-400'
                        : inc.status === 'DISPATCHED'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>

                {/* Title & Category */}
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="mt-0.5">
                    {getCategoryIcon(inc.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition truncate">
                      {inc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{inc.location_address}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>

                {/* Quick AI Tags: Victims & Hazards */}
                {inc.triage && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                    {inc.triage.estimated_victims > 0 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        <Users className="w-3 h-3" />
                        <span>~{inc.triage.estimated_victims} victim{inc.triage.estimated_victims > 1 ? 's' : ''}</span>
                      </span>
                    )}
                    {inc.triage.detected_hazards.slice(0, 2).map((h, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {h}
                      </span>
                    ))}
                    {inc.triage.detected_hazards.length > 2 && (
                      <span className="text-slate-500">
                        +{inc.triage.detected_hazards.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Assigned Units Bar */}
                {inc.assigned_unit_ids.length > 0 && (
                  <div className="mt-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
                    <span className="text-slate-500">Assigned:</span>
                    {inc.assigned_unit_ids.map(uid => (
                      <span key={uid} className="px-1.5 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/30 text-cyan-300">
                        {uid.replace('unit-', '').toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
