import React from 'react';
import { ResponderUnit, UnitStatus, UnitType } from '../types';
import { api } from '../services/api';
import { 
  Truck, Radio, BatteryCharging, Users, Gauge, 
  RotateCcw, Shield, Navigation, Plane
} from 'lucide-react';

interface DispatchControlProps {
  units: ResponderUnit[];
  onUnitUpdated: (unit: ResponderUnit) => void;
  onSelectUnit?: (unit: ResponderUnit) => void;
}

export const DispatchControl: React.FC<DispatchControlProps> = ({
  units,
  onUnitUpdated,
  onSelectUnit
}) => {
  const handleResetUnit = async (unitId: string) => {
    try {
      const updated = await api.updateUnitStatus(unitId, 'IDLE' as UnitStatus);
      onUnitUpdated(updated);
    } catch (err) {
      alert(`Status update failed: ${err}`);
    }
  };

  const getUnitIcon = (type: UnitType) => {
    switch (type) {
      case 'DRONE_AERIAL_RECON':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case 'AMBULANCE_PARAMEDIC':
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'FIRE_ENGINE':
        return <Truck className="w-4 h-4 text-rose-400" />;
      case 'HEAVY_RESCUE':
        return <Truck className="w-4 h-4 text-amber-400" />;
      default:
        return <Shield className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: UnitStatus) => {
    switch (status) {
      case 'IDLE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'EN_ROUTE':
      case 'DISPATCHED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-neon-blue animate-pulse';
      case 'ON_SCENE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-command-panel/80 rounded-xl border border-command-border backdrop-blur-md overflow-hidden">
      <div className="p-3 border-b border-command-border flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Active Responder Fleet
          </h2>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
          {units.filter(u => u.status === 'IDLE').length} / {units.length} Available
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono">
        {units.map(unit => {
          const isEnRoute = unit.status === 'EN_ROUTE' || unit.status === 'DISPATCHED';

          return (
            <div
              key={unit.id}
              onClick={() => onSelectUnit && onSelectUnit(unit)}
              className="p-3 rounded-lg bg-command-surface/70 border border-slate-800 hover:border-slate-700 transition space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-700">
                    {getUnitIcon(unit.type)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition block">
                      {unit.callsign}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {unit.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(unit.status)}`}>
                  {unit.status}
                </span>
              </div>

              {/* Transit Details if Dispatched */}
              {isEnRoute && (
                <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center justify-between">
                  <span>Assigned: {unit.assigned_incident_id}</span>
                  <span className="font-bold">ETA: ~{unit.eta_minutes || 0} min ({unit.speed_kmh} km/h)</span>
                </div>
              )}

              {/* Fleet Telemetry: Fuel/Battery & Crew */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{unit.battery_or_fuel_pct}% Fuel/Power</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{unit.personnel_count} Crew</span>
                </div>
                {unit.status !== 'IDLE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetUnit(unit.id);
                    }}
                    title="Recall / Reset to Idle"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-cyan-400" />
                    <span>Recall</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
