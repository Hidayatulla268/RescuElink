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
  AutoScrambleResult,
  RoadSegment,
  HospitalRoutingRequest,
  HospitalRoutingResponse,
  DriverRouteAcceptanceRequest,
  DriverRouteAcceptanceResponse
} from '../types';

function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    // In development mode on Vite dev server port 5173/3000, target default backend port 8000
    if (window.location.port === '5173' || window.location.port === '3000') {
      return 'http://localhost:8000/api/v1';
    }
    // In production (same origin or reverse proxy)
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

function getWsBase(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '3000') {
      return 'ws://localhost:8000/api/v1/ws/events';
    }
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${window.location.host}/api/v1/ws/events`;
  }
  return 'ws://localhost:8000/api/v1/ws/events';
}

export const API_BASE = getApiBase();
export const WS_BASE = getWsBase();


export interface DispatchUnitsResponse {
  incident_id: string;
  status: string;
  dispatched_units: ResponderUnit[];
  timestamp: string;
}

export interface ResolveIncidentResponse {
  status: string;
  incident_id: string;
}

export interface GovLoginPayload {
  badge_id: string;
  role: string;
  name: string;
  department?: string;
}

export interface GovLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    badge_id: string;
    role: string;
    name: string;
    department: string;
    is_verified: boolean;
  };
  expires_in_seconds: number;
  issued_at: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('rescuenlink_gov_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  async createIncident(payload: IncidentCreatePayload): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to create incident: ${res.statusText}`);
    return res.json();
  },

  async getRecommendations(incidentId: string): Promise<RecommendationsResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/recommendations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch recommendations for ${incidentId}`);
    return res.json();
  },

  async dispatchUnits(incidentId: string, unitIds: string[]): Promise<DispatchUnitsResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ incident_id: incidentId, unit_ids: unitIds })
    });
    if (!res.ok) throw new Error(`Failed to dispatch units: ${res.statusText}`);
    return res.json();
  },

  async resolveIncident(incidentId: string): Promise<ResolveIncidentResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to resolve incident: ${res.statusText}`);
    return res.json();
  },

  async generateBroadcast(
    incidentId: string,
    languages: string[] = ['Hindi', 'Kannada', 'Tamil', 'English'],
    advisoryType: string = 'EVACUATION_OR_SHELTER'
  ): Promise<CitizenBroadcastResponse> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const res = await fetch(`${API_BASE}/units`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch units: ${res.statusText}`);
    return res.json();
  },

  async updateUnitStatus(unitId: string, status: UnitStatus): Promise<ResponderUnit> {
    const res = await fetch(`${API_BASE}/units/${unitId}/status?status=${status}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to update unit status: ${res.statusText}`);
    return res.json();
  },

  async getSensors(): Promise<IoTSensor[]> {
    const res = await fetch(`${API_BASE}/sensors`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch sensors: ${res.statusText}`);
    return res.json();
  },

  async getMetrics(): Promise<UrbanRiskMetrics> {
    const res = await fetch(`${API_BASE}/analytics/metrics`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch risk metrics: ${res.statusText}`);
    return res.json();
  },

  // Green Corridor & Hospitals
  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch(`${API_BASE}/hospitals`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch hospitals: ${res.statusText}`);
    return res.json();
  },

  async getTrafficSignals(): Promise<TrafficSignal[]> {
    const res = await fetch(`${API_BASE}/traffic-signals`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch traffic signals: ${res.statusText}`);
    return res.json();
  },

  async startGreenCorridor(payload: GreenCorridorTransitRequest): Promise<GreenCorridorTransitSession> {
    const res = await fetch(`${API_BASE}/ambulance/transit/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to start Green Corridor: ${res.statusText}`);
    return res.json();
  },

  async getActiveCorridor(ambulanceId: string): Promise<GreenCorridorTransitSession> {
    const res = await fetch(`${API_BASE}/ambulance/corridor/${ambulanceId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to get corridor for ${ambulanceId}`);
    return res.json();
  },

  async reportAccidentSnap(payload: CitizenSnapReport): Promise<AutoScrambleResult> {
    const res = await fetch(`${API_BASE}/citizen-snap-sos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to report accident: ${res.statusText}`);
    return res.json();
  },

  async govLogin(payload: GovLoginPayload): Promise<GovLoginResponse> {
    const res = await fetch(`${API_BASE}/auth/gov-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Government login failed: ${res.statusText}`);
    const data: GovLoginResponse = await res.json();
    if (data.access_token) {
      localStorage.setItem('rescuenlink_gov_token', data.access_token);
      localStorage.setItem('rescuenlink_gov_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getHospitalRouting(payload: HospitalRoutingRequest): Promise<HospitalRoutingResponse> {
    const res = await fetch(`${API_BASE}/routing/nearest-hospital`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to calculate hospital routes: ${res.statusText}`);
    return res.json();
  },

  async getRoadsTraffic(): Promise<RoadSegment[]> {
    const res = await fetch(`${API_BASE}/routing/roads`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch road network traffic: ${res.statusText}`);
    return res.json();
  },

  async driverAcceptRoute(payload: DriverRouteAcceptanceRequest): Promise<DriverRouteAcceptanceResponse> {
    const res = await fetch(`${API_BASE}/routing/driver/accept-route`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to accept route: ${res.statusText}`);
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
    } catch {
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
