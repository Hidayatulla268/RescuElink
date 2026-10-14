import React, { useState, useEffect } from 'react';
import { 
  Incident, RecommendationsResponse, UnitRecommendation, ResponderUnit 
} from '../types';
import { api } from '../services/api';
import { 
  X, ShieldAlert, Cpu, Users, MapPin, Phone, User, 
  Send, CheckSquare, Square, Radio, AlertTriangle, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onDispatchSuccess: (incidentId: string, unitIds: string[]) => void;
  onResolveSuccess: (incidentId: string) => void;
  onOpenBroadcast: (incident: Incident) => void;
  units: ResponderUnit[];
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onDispatchSuccess,
  onResolveSuccess,
  onOpenBroadcast,
  units
}) => {
  if (!incident) return null;

  const [recommendations, setRecommendations] = useState<UnitRecommendation[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [completedSOPs, setCompletedSOPs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!incident) return;
      setLoadingRecs(true);
      try {
        const res = await api.getRecommendations(incident.id);
        if (isMounted) {
          setRecommendations(res.recommended_units);
          // Pre-select top recommended idle unit if not already dispatched
          const topPick = res.recommended_units.find(u => u.current_status === 'IDLE');
          if (topPick && incident.assigned_unit_ids.length === 0) {
            setSelectedUnitIds([topPick.unit_id]);
          }
        }
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [incident.id]);

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const handleDispatch = async () => {
    if (selectedUnitIds.length === 0) return;
    setDispatching(true);
    try {
      await api.dispatchUnits(incident.id, selectedUnitIds);
      onDispatchSuccess(incident.id, selectedUnitIds);
    } catch (err) {
      alert(`Dispatch failed: ${err}`);
    } finally {
      setDispatching(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm(`Mark incident ${incident.id} as RESOLVED? Assigned units will return to IDLE.`)) return;
    try {
      await api.resolveIncident(incident.id);
      onResolveSuccess(incident.id);
      onClose();
    } catch (err) {
      alert(`Resolve failed: ${err}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleSOP = (idx: number) => {
    setCompletedSOPs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isResolved = incident.status === 'RESOLVED';

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-modal-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
              incident.priority === 'P1'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-neon-red animate-pulse'
                : incident.priority === 'P2'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-neon-amber'
                : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40'
            }`}>
              {incident.priority} CRITICAL
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{incident.title}</span>
                <span className="text-xs text-slate-400 font-normal">({incident.id})</span>
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{incident.location_address}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/50 transition-all duration-200 active:scale-95 shadow-md"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3 font-mono">
              <User className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Caller Identity</span>
                <p className="text-xs font-semibold text-slate-200">{incident.caller_name}</p>
                <p className="text-[11px] text-slate-400">{incident.caller_phone}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3 font-mono">
              <Users className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Casualty Assessment</span>
                <p className="text-xs font-semibold text-slate-200">
                  ~{incident.triage?.estimated_victims || 0} Reported Victims
                </p>
                <p className="text-[11px] text-slate-400">
                  Radius: {incident.triage?.evacuation_radius_meters || 100}m
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3 font-mono">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase">AI Triage Severity</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                      style={{ width: `${incident.triage?.severity_score || 70}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-rose-400">
                    {incident.triage?.severity_score || 70}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Intake Description */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5 font-mono text-xs">
            <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">
              Raw 911 / Citizen Voice Transcription
            </span>
            <p className="text-slate-300 italic leading-relaxed">
              "{incident.raw_description}"
            </p>
          </div>

          {/* Gemini AI Triage Breakdown */}
          {incident.triage && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-950/20 to-slate-900/80 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-cyan-300">
                    Gemini 3.8 Flash Autonomous Reasoning & Hazard Synthesis
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Confidence: {Math.round(incident.triage.confidence_score * 100)}%
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {incident.triage.reasoning_summary}
              </p>

              {/* Detected Hazards Tags */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1.5">
                  Identified Tactical Hazards
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {incident.triage.detected_hazards.map((hazard, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 text-[11px]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{hazard}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Standard Operating Procedures (SOP) Checklist */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1.5">
                  Tactical SOP Action Checklist (Interactive)
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {incident.triage.standard_operating_procedures.map((sop, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSOP(idx)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center gap-2.5 ${
                        completedSOPs[idx]
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 line-through'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {completedSOPs[idx] ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span>{sop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Autonomous Unit Dispatch Recommendation */}
          {!isResolved && (
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-100 flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span>Autonomous First Responder Allocation</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Proximity, traffic impedance, and capability matching computed via Dispatch Engine.
                  </p>
                </div>
                {loadingRecs && (
                  <span className="text-xs font-mono text-cyan-400 animate-pulse">
                    Computing optimal routes...
                  </span>
                )}
              </div>

              {/* Units List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono">
                {recommendations.map(rec => {
                  const isSelected = selectedUnitIds.includes(rec.unit_id);
                  const isIdle = rec.current_status === 'IDLE';

                  return (
                    <div
                      key={rec.unit_id}
                      onClick={() => isIdle && toggleUnitSelection(rec.unit_id)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-neon-blue'
                          : !isIdle
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{rec.callsign}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                          Fit: {rec.fit_score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Dist: {rec.distance_km} km</span>
                        <span className="text-amber-400 font-bold">ETA: ~{rec.estimated_eta_minutes} min</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 truncate">
                        {rec.rationale}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleDispatch}
                  disabled={dispatching || selectedUnitIds.length === 0}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-neon-blue transition transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {dispatching
                      ? 'Transmitting Dispatch Orders...'
                      : `Dispatch ${selectedUnitIds.length} Unit(s)`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <button
            onClick={() => onOpenBroadcast(incident)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 font-semibold flex items-center gap-1.5 transition"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Generate Multilingual Citizen Broadcast</span>
          </button>

          <div className="flex items-center gap-2">
            {!isResolved && (
              <button
                onClick={handleResolve}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark Incident Resolved</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
