import React from 'react';
import { IoTSensor, SensorAlertStatus, SensorType } from '../types';
import { 
  Activity, Droplets, Wind, Thermometer, Radio, 
  AlertTriangle, ShieldCheck, Zap
} from 'lucide-react';

interface SensorMonitorProps {
  sensors: IoTSensor[];
  onInjectSpike?: (sensorId: string) => void;
}

export const SensorMonitor: React.FC<SensorMonitorProps> = ({
  sensors,
  onInjectSpike
}) => {
  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'FLOOD_DEPTH':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'AIR_QUALITY_AQI':
        return <Wind className="w-4 h-4 text-emerald-400" />;
      case 'THERMAL_HEAT':
        return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'TRAFFIC_CONGESTION':
        return <Radio className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: SensorAlertStatus) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-neon-red animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NORMAL':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-command-panel/80 rounded-xl border border-command-border backdrop-blur-md overflow-hidden">
      <div className="p-3 border-b border-command-border flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Smart City IoT Sensor Mesh
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            {sensors.filter(s => s.status === 'CRITICAL').length} Critical Alerts
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
        {sensors.map(sensor => {
          const ratio = Math.min((sensor.value / (sensor.threshold * 1.5)) * 100, 100);
          const isCritical = sensor.status === 'CRITICAL';

          return (
            <div
              key={sensor.id}
              className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-neon-red'
                  : 'bg-command-surface/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getSensorIcon(sensor.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {sensor.name}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      ID: {sensor.id} • Lat {sensor.location.lat.toFixed(3)}, Lng {sensor.location.lng.toFixed(3)}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(sensor.status)}`}>
                  {sensor.status}
                </span>
              </div>

              {/* Gauge Value vs Threshold */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Telemetry Value:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={isCritical ? 'text-rose-400 text-sm' : 'text-cyan-300'}>
                      {sensor.value} {sensor.unit}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      (Threshold: {sensor.threshold} {sensor.unit.split(' ')[0]})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-rose-500'
                        : sensor.status === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Updated: {new Date(sensor.last_updated).toLocaleTimeString()}</span>
                {onInjectSpike && (
                  <button
                    onClick={() => onInjectSpike(sensor.id)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Simulate Surge</span>
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
