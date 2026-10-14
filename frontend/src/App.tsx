import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { IncidentMap } from './components/IncidentMap';
import { IncidentFeed } from './components/IncidentFeed';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { NewIncidentModal } from './components/NewIncidentModal';
import { DispatchControl } from './components/DispatchControl';
import { SensorMonitor } from './components/SensorMonitor';
import { CitizenBroadcastModal } from './components/CitizenBroadcastModal';
import { AnalyticsView } from './components/AnalyticsView';
import { GreenCorridorCockpit } from './components/GreenCorridorCockpit';
import { CitizenSnapModal } from './components/CitizenSnapModal';
import { GovernmentLoginModal } from './components/GovernmentLoginModal';
import { MobileAppView } from './components/MobileAppView';
import { CitizenPublicView } from './components/CitizenPublicView';
import { 
  Incident, ResponderUnit, IoTSensor, Hospital, TrafficSignal, 
  GreenCorridorTransitSession, AutoScrambleResult, GovernmentUser, ViewMode 
} from './types';
import { api, RealtimeClient } from './services/api';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [governmentUser, setGovernmentUser] = useState<GovernmentUser | null>(null);
  const [operatorPreview, setOperatorPreview] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'command' | 'map' | 'corridor' | 'sensors' | 'analytics'>('command');
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<ResponderUnit[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [activeCorridor, setActiveCorridor] = useState<GreenCorridorTransitSession | null>(null);
  
  // Highlighted incident on Map vs Inspected incident in Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [inspectingIncident, setInspectingIncident] = useState<Incident | null>(null);
  
  // Modals
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState<boolean>(false);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState<boolean>(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [isGovLoginOpen, setIsGovLoginOpen] = useState<boolean>(false);
  const [broadcastIncident, setBroadcastIncident] = useState<Incident | null>(null);

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const [incList, unitList, sensorList, hospList, sigList] = await Promise.all([
        api.getIncidents(),
        api.getUnits(),
        api.getSensors(),
        api.getHospitals(),
        api.getTrafficSignals()
      ]);
      setIncidents(incList);
      setUnits(unitList);
      setSensors(sensorList);
      setHospitals(hospList);
      setTrafficSignals(sigList);

      // Default select the first P1 incident for map focus only if none selected
      setSelectedIncident(prev => {
        if (!prev && incList.length > 0) {
          const topP1 = incList.find(i => i.priority === 'P1');
          return topP1 || incList[0];
        }
        return prev;
      });
    } catch (err) {
      console.warn('Initial fetch issue (backend may still be bootstrapping):', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // Polling fallback
    return () => clearInterval(interval);
  }, [loadData]);

  // WebSocket Live Subscription
  useEffect(() => {
    const wsClient = new RealtimeClient((event, payload) => {
      if (event === 'INCIDENT_CREATED') {
        setIncidents(prev => [payload, ...prev]);
        setSelectedIncident(payload);
      } else if (event === 'UNITS_DISPATCHED') {
        loadData();
      } else if (event === 'INCIDENT_RESOLVED') {
        loadData();
      } else if (event === 'GREEN_CORRIDOR_ACTIVATED') {
        setActiveCorridor(payload);
        loadData();
      } else if (event === 'ACCIDENT_PHOTO_AUTO_SCRAMBLE') {
        loadData();
      } else if (event === 'TELEMETRY_PULSE') {
        if (payload.sensors) setSensors(payload.sensors);
        if (payload.units) setUnits(payload.units);
        if (payload.signals) setTrafficSignals(payload.signals);
        if (payload.hospitals) setHospitals(payload.hospitals);
      }
    });

    return () => {
      wsClient.disconnect();
    };
  }, [loadData]);

  // Modal & Action Handlers
  const handleOpenInspect = (inc: Incident) => {
    setSelectedIncident(inc);
    setInspectingIncident(inc);
  };

  const handleIncidentCreated = (newInc: Incident) => {
    setIncidents(prev => [newInc, ...prev.filter(i => i.id !== newInc.id)]);
    setSelectedIncident(newInc);
    setInspectingIncident(newInc);
  };

  const handleAutoScrambled = (result: AutoScrambleResult) => {
    loadData();
    const found = incidents.find(i => i.id === result.incident_id);
    if (found) {
      setSelectedIncident(found);
      setInspectingIncident(found);
    }
  };

  const handleDispatchSuccess = (incidentId: string, unitIds: string[]) => {
    loadData();
  };

  const handleResolveSuccess = (incidentId: string) => {
    loadData();
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident(null);
    }
    if (inspectingIncident?.id === incidentId) {
      setInspectingIncident(null);
    }
  };

  const handleOpenBroadcast = (incident: Incident) => {
    setBroadcastIncident(incident);
    setIsBroadcastOpen(true);
  };

  const handleInjectSpike = (sensorId: string) => {
    setSensors(prev => prev.map(s => {
      if (s.id === sensorId) {
        return {
          ...s,
          value: Number((s.threshold * 1.35).toFixed(2)),
          status: 'CRITICAL',
          last_updated: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  const handleLoginUser = (user: GovernmentUser) => {
    setGovernmentUser(user);
    setOperatorPreview(false);
    // If ambulance driver logged in, switch them to the Corridor cockpit
    if (user.role === 'AMBULANCE_DRIVER') {
      setActiveTab('corridor');
    } else {
      setActiveTab('command');
    }
  };

  const activeP1Count = incidents.filter(i => i.priority === 'P1' && i.status !== 'RESOLVED').length;
  const totalActiveCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const isGovView = governmentUser !== null || operatorPreview === true;

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col tactical-grid select-none">
      {/* Top Header Command Bar with View Switcher & Gov Access */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        governmentUser={governmentUser}
        isGovView={isGovView}
        onOpenGovLogin={() => setIsGovLoginOpen(true)}
        onSwitchToCitizenView={() => {
          setOperatorPreview(false);
          setGovernmentUser(null);
        }}
        onOpenNewIncident={() => setIsNewIncidentOpen(true)}
        onOpenSnapAccident={() => setIsSnapModalOpen(true)}
        activeP1Count={activeP1Count}
        totalActiveCount={totalActiveCount}
      />

      {/* Main View: Dual-Form (Desktop Web vs Mobile App) */}
      {viewMode === 'mobile' ? (
        <MobileAppView
          incidents={incidents}
          units={units}
          sensors={sensors}
          hospitals={hospitals}
          trafficSignals={trafficSignals}
          activeCorridor={activeCorridor}
          governmentUser={governmentUser}
          onOpenInspect={handleOpenInspect}
          onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          onOpenSnapAccident={() => setIsSnapModalOpen(true)}
          onOpenGovLogin={() => setIsGovLoginOpen(true)}
          onOpenBroadcast={handleOpenBroadcast}
          onCorridorActivated={(session) => {
            setActiveCorridor(session);
            loadData();
          }}
        />
      ) : !isGovView ? (
        /* Clean Citizen Public Webpage (No complex operator clutter) */
        <CitizenPublicView
          incidents={incidents}
          hospitals={hospitals}
          trafficSignals={trafficSignals}
          activeCorridor={activeCorridor}
          onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          onOpenSnapAccident={() => setIsSnapModalOpen(true)}
          onOpenGovLogin={() => setIsGovLoginOpen(true)}
          onOpenCorridorTab={() => {
            setOperatorPreview(true);
            setActiveTab('corridor');
          }}
          onLoginAsSample={handleLoginUser}
          onSwitchToOperatorView={() => setOperatorPreview(true)}
        />
      ) : (
        /* Authorized Government & Emergency Responder Console */
        <main className="flex-1 flex flex-col p-3 sm:p-4 max-w-[1920px] w-full mx-auto overflow-hidden">
          {/* Government Mode Status Banner */}
          <div className="mb-3 px-4 py-2.5 rounded-2xl glass-card-ultra border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-neon-green" />
              <span className="text-white font-bold">
                {governmentUser 
                  ? `Authorized Personnel: ${governmentUser.fullName} (${governmentUser.badgeNumber}) — ${governmentUser.roleTitle}`
                  : 'Operator Console Preview Mode (Demo View)'}
              </span>
            </div>
            <button
              onClick={() => {
                setOperatorPreview(false);
                setGovernmentUser(null);
              }}
              className="text-[11px] px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/15 transition"
            >
              Return to Citizen Public Webpage
            </button>
          </div>

          {activeTab === 'command' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 h-[calc(100vh-130px)]">
              {/* Left Column: Live Incident Feed (4 cols) */}
              <div className="lg:col-span-4 h-full flex flex-col">
                <IncidentFeed
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleOpenInspect}
                  onOpenNewIncident={() => setIsNewIncidentOpen(true)}
                />
              </div>

              {/* Middle Column: Tactical Radar GIS Map with Traffic Signals & Hospitals (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <IncidentMap
                  incidents={incidents}
                  units={units}
                  sensors={sensors}
                  hospitals={hospitals}
                  trafficSignals={trafficSignals}
                  activeCorridor={activeCorridor}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleOpenInspect}
                />
              </div>

              {/* Right Column: Fleet Management & IoT Telemetry (3 cols) */}
              <div className="lg:col-span-3 h-full flex flex-col gap-4">
                <div className="h-1/2">
                  <DispatchControl
                    units={units}
                    onUnitUpdated={() => loadData()}
                  />
                </div>
                <div className="h-1/2">
                  <SensorMonitor
                    sensors={sensors}
                    onInjectSpike={handleInjectSpike}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Green Corridor Cockpit Tab */}
          {activeTab === 'corridor' && (
            <div className="flex-1 overflow-y-auto">
              <GreenCorridorCockpit
                units={units}
                hospitals={hospitals}
                trafficSignals={trafficSignals}
                onCorridorActivated={(session) => {
                  setActiveCorridor(session);
                  loadData();
                }}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="flex-1 h-[calc(100vh-130px)] flex flex-col">
              <IncidentMap
                incidents={incidents}
                units={units}
                sensors={sensors}
                hospitals={hospitals}
                trafficSignals={trafficSignals}
                activeCorridor={activeCorridor}
                selectedIncident={selectedIncident}
                onSelectIncident={handleOpenInspect}
              />
            </div>
          )}

          {activeTab === 'sensors' && (
            <div className="flex-1 h-[calc(100vh-130px)]">
              <SensorMonitor
                sensors={sensors}
                onInjectSpike={handleInjectSpike}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto">
              <AnalyticsView />
            </div>
          )}
        </main>
      )}

      {/* Modals — Fully accessible across all modes */}
      <IncidentDetailModal
        incident={inspectingIncident}
        onClose={() => setInspectingIncident(null)}
        onDispatchSuccess={handleDispatchSuccess}
        onResolveSuccess={handleResolveSuccess}
        onOpenBroadcast={handleOpenBroadcast}
        units={units}
      />

      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        onCreated={handleIncidentCreated}
      />

      <CitizenSnapModal
        isOpen={isSnapModalOpen}
        onClose={() => setIsSnapModalOpen(false)}
        onAutoScrambled={handleAutoScrambled}
        onOpenGreenCorridor={() => {
          setIsSnapModalOpen(false);
          setOperatorPreview(true);
          setActiveTab('corridor');
        }}
      />

      <CitizenBroadcastModal
        incident={broadcastIncident || selectedIncident}
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />

      <GovernmentLoginModal
        isOpen={isGovLoginOpen}
        onClose={() => setIsGovLoginOpen(false)}
        currentUser={governmentUser}
        onLogin={handleLoginUser}
        onLogout={() => {
          setGovernmentUser(null);
          setOperatorPreview(false);
        }}
      />
    </div>
  );
};

export default App;
