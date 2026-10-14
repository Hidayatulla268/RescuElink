import React, { useState, useEffect } from 'react';
import { UrbanRiskMetrics } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, Activity, TrendingUp, AlertTriangle, 
  Clock, CheckCircle, MapPin, Cpu, BarChart3, Radio
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<UrbanRiskMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        <span>Synthesizing Urban Vulnerability Matrix...</span>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 space-y-6 font-mono">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resilience Score */}
        <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl relative overflow-hidden flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Urban Resilience Index
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">
                {metrics.overall_city_resilience_score}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Metropolitan Grid Stable
            </p>
          </div>
          <div className="relative flex items-center justify-center w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#00E5FF"
                strokeWidth="5"
                strokeDasharray={`${(metrics.overall_city_resilience_score / 100) * 163} 163`}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <ShieldAlert className="w-6 h-6 text-cyan-400 absolute" />
          </div>
        </div>

        {/* P1 Critical Incidents */}
        <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Active Critical P1 Crisis
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-rose-400">
                {metrics.p1_critical_count}
              </span>
              <span className="text-xs text-slate-400">
                of {metrics.active_incidents_count} total
              </span>
            </div>
            <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Direct Life-Threat Protocol
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Fleet Availability */}
        <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Responder Fleet Available
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-cyan-400">
                {metrics.available_units_count}
              </span>
              <span className="text-xs text-slate-400">Units Ready</span>
            </div>
            <p className="text-[10px] text-cyan-300 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-cyan-400" />
              Rapid Deployment Staging
            </p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Average Dispatch ETA */}
        <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Mean Dispatch ETA
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-amber-400">
                {metrics.average_dispatch_eta_minutes}
              </span>
              <span className="text-xs text-slate-400">min</span>
            </div>
            <p className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              -38% vs Traditional Dispatch
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle: High-Risk Urban Sectors & Hazard Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vulnerability Zones */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Predictive Urban Vulnerability Sectors
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">
              Correlated against IoT Sensor Telemetry
            </span>
          </div>

          <div className="space-y-3">
            {metrics.high_risk_zones.map(zone => (
              <div
                key={zone.zone_id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      zone.threat_level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : zone.threat_level === 'ELEVATED'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {zone.threat_level}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100">
                      {zone.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400">
                      {zone.vulnerability_index}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Threat Index</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <span className="text-slate-500 text-[10px]">Active Compounding Hazards:</span>
                  {zone.active_hazards.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {h}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500">
                  Sector Population: {zone.population_density}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations for City Leaders */}
        <div className="p-5 rounded-xl bg-command-panel/90 border border-command-border shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Autonomous Municipal Co-Pilot
            </h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">
                1. Pre-position Swiftwater Boats
              </span>
              <p className="text-[11px] text-slate-400">
                Mission Creek gauge exceeds 2.4m threshold. Move Heavy Rescue 401 staging forward to 6th St bridge embankment.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">
                2. Automated Traffic Signal Priority
              </span>
              <p className="text-[11px] text-slate-400">
                Grant continuous green corridors on Market St for ambulances inbound to Trauma Center.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-rose-400 font-bold block mb-1">
                3. Airborne HAZMAT Perimeter
              </span>
              <p className="text-[11px] text-slate-400">
                Maintain 600m evacuation buffer around Pier 38 chemical warehouse until thermal drone confirms core containment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
