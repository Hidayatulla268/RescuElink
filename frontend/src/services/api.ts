import {
  Incident,
  IncidentCreatePayload,
  ResponderUnit,
  IoTSensor,
  RecommendationsResponse,
  CitizenBroadcastResponse,
  UrbanRiskMetrics,
  UnitStatus,
  Hospital,
  TrafficSignal,
  GreenCorridorTransitRequest,
  GreenCorridorTransitSession,
  CitizenSnapReport,
  AutoScrambleResult
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';
const WS_BASE = 'ws://localhost:8000/api/v1/ws/events';

export const api = {
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  async createIncident(payload: IncidentCreatePayload): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to create incident: ${res.statusText}`);
    return res.json();
  },

  async getRecommendations(incidentId: string): Promise<RecommendationsResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/recommendations`);
    if (!res.ok) throw new Error(`Failed to fetch recommendations for ${incidentId}`);
    return res.json();
  },

  async dispatchUnits(incidentId: string, unitIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId, unit_ids: unitIds })
    });
    if (!res.ok) throw new Error(`Failed to dispatch units: ${res.statusText}`);
    return res.json();
  },

  async resolveIncident(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Failed to resolve incident: ${res.statusText}`);
    return res.json();
  },

  async generateBroadcast(
    incidentId: string,
    languages: string[] = ['English', 'Spanish', 'Hindi', 'French'],
    advisoryType: string = 'EVACUATION_OR_SHELTER'
  ): Promise<CitizenBroadcastResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_id: incidentId,
        languages,
        advisory_type: advisoryType
      })
    });
    if (!res.ok) throw new Error(`Failed to generate broadcast: ${res.statusText}`);
    return res.json();
  },

  async getUnits(): Promise<ResponderUnit[]> {
    const res = await fetch(`${API_BASE}/units`);
    if (!res.ok) throw new Error(`Failed to fetch units: ${res.statusText}`);
    return res.json();
  },

  async updateUnitStatus(unitId: string, status: UnitStatus): Promise<ResponderUnit> {
    const res = await fetch(`${API_BASE}/units/${unitId}/status?status=${status}`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error(`Failed to update unit status: ${res.statusText}`);
    return res.json();
  },

  async getSensors(): Promise<IoTSensor[]> {
    const res = await fetch(`${API_BASE}/sensors`);
    if (!res.ok) throw new Error(`Failed to fetch sensors: ${res.statusText}`);
    return res.json();
  },

  async getMetrics(): Promise<UrbanRiskMetrics> {
    const res = await fetch(`${API_BASE}/analytics/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch risk metrics: ${res.statusText}`);
    return res.json();
  },

  // Green Corridor & Hospitals
  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch(`${API_BASE}/hospitals`);
    if (!res.ok) throw new Error(`Failed to fetch hospitals: ${res.statusText}`);
    return res.json();
  },

  async getTrafficSignals(): Promise<TrafficSignal[]> {
    const res = await fetch(`${API_BASE}/traffic-signals`);
    if (!res.ok) throw new Error(`Failed to fetch traffic signals: ${res.statusText}`);
    return res.json();
  },

  async startGreenCorridor(payload: GreenCorridorTransitRequest): Promise<GreenCorridorTransitSession> {
    const res = await fetch(`${API_BASE}/ambulance/transit/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to start Green Corridor: ${res.statusText}`);
    return res.json();
  },

  async getActiveCorridor(ambulanceId: string): Promise<GreenCorridorTransitSession> {
    const res = await fetch(`${API_BASE}/ambulance/corridor/${ambulanceId}`);
    if (!res.ok) throw new Error(`Failed to get corridor for ${ambulanceId}`);
    return res.json();
  },

  async reportAccidentSnap(payload: CitizenSnapReport): Promise<AutoScrambleResult> {
    const res = await fetch(`${API_BASE}/citizen-snap-sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to report accident: ${res.statusText}`);
    return res.json();
  }
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((event: string, data: Record<string, unknown>) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(onMessage: (event: string, data: Record<string, unknown>) => void) {
    this.onMessageCallback = onMessage;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to RescuELINK live dispatch bus');
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event && parsed.payload && this.onMessageCallback) {
            this.onMessageCallback(parsed.event, parsed.payload);
          }
        } catch (err) {
          console.warn('[WebSocket] message parse error', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected, scheduling reconnect...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] error', err);
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
  }
}
