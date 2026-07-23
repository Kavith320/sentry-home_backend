export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.trim();
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:3000/api/admin`;
  }
  return 'http://localhost:3000/api/admin';
}

export interface DashboardSummary {
  gateways: {
    total: number;
    online: number;
    offline: number;
    distinctHomesCount: number;
    staleCount: number;
  };
  sensors: {
    total: number;
    lowBatteryCount: number;
    lowBatteryThreshold: number;
    statesBreakdown: Record<string, number>;
    staleCount: number;
  };
  telemetry24hCount: number;
}

export interface GatewayDevice {
  _id: string;
  chipId: string;
  connectionStatus: 'online' | 'offline';
  homeId: string | null;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorDevice {
  _id: string;
  chipId: string;
  sensorState: string;
  battery: number | null;
  rssi: number | null;
  gatewayTimestamp: string | null;
  lastGatewayChipId: string | null;
  lastSeen: string;
  telemetryData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryLogItem {
  _id: string;
  gatewayChipId: string;
  sensorChipId: string;
  sensorState: string;
  battery: number | null;
  rssi: number | null;
  gatewayTimestamp: string | null;
  timestamp: string;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${getApiBaseUrl()}/dashboard/summary`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch summary');
  return data.data;
}

export async function fetchGatewayByChipId(chipId: string): Promise<GatewayDevice | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/gateways/${encodeURIComponent(chipId)}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function fetchSensorByChipId(chipId: string): Promise<SensorDevice | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/sensors/${encodeURIComponent(chipId)}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function fetchGateways(): Promise<GatewayDevice[]> {
  const res = await fetch(`${getApiBaseUrl()}/gateways`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch gateways');
  return data.data;
}

export async function fetchSensors(gatewayChipId?: string): Promise<SensorDevice[]> {
  const url = gatewayChipId
    ? `${getApiBaseUrl()}/sensors?gatewayChipId=${encodeURIComponent(gatewayChipId)}`
    : `${getApiBaseUrl()}/sensors`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch sensors');
  return data.data;
}

export async function fetchLowBatteryAlerts(threshold = 3.3): Promise<SensorDevice[]> {
  const res = await fetch(`${getApiBaseUrl()}/dashboard/alerts/low-battery?threshold=${threshold}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch low battery alerts');
  return data.data;
}

export async function fetchStaleDevices(minutes = 30): Promise<{ gateways: GatewayDevice[]; sensors: SensorDevice[] }> {
  const res = await fetch(`${getApiBaseUrl()}/dashboard/alerts/stale-devices?minutes=${minutes}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch stale devices');
  return data.data;
}

export async function fetchHomeTopology(homeId: string): Promise<{ gateways: GatewayDevice[]; sensors: SensorDevice[] }> {
  const res = await fetch(`${getApiBaseUrl()}/dashboard/homes/${encodeURIComponent(homeId)}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch topology');
  return data.data;
}

export async function fetchTelemetryHistory(page = 1, limit = 20, sensorChipId?: string, gatewayChipId?: string) {
  let url = `${getApiBaseUrl()}/dashboard/telemetry/history?page=${page}&limit=${limit}`;
  if (sensorChipId) url += `&sensorChipId=${encodeURIComponent(sensorChipId)}`;
  if (gatewayChipId) url += `&gatewayChipId=${encodeURIComponent(gatewayChipId)}`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch history');
  return data;
}

export async function updateGatewayStatus(chipId: string, connectionStatus: 'online' | 'offline', homeId?: string) {
  const res = await fetch(`${getApiBaseUrl()}/gateways/${encodeURIComponent(chipId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectionStatus, homeId })
  });
  return res.json();
}

export async function updateSensorState(chipId: string, sensorState: string, battery?: number, rssi?: number) {
  const res = await fetch(`${getApiBaseUrl()}/sensors/${encodeURIComponent(chipId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sensorState, battery, rssi })
  });
  return res.json();
}

export async function simulateTelemetry(payload: { gatewayChipId: string; sensorChipId: string; sensorState: string; battery?: number; rssi?: number }) {
  const res = await fetch(`${getApiBaseUrl()}/telemetry/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deleteDeviceByChipId(chipId: string) {
  const res = await fetch(`${getApiBaseUrl()}/devices/${encodeURIComponent(chipId)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete device');
  return data;
}

export async function purgeAllSystemData() {
  const res = await fetch(`${getApiBaseUrl()}/system/purge-all`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to purge database');
  return data;
}

export interface SystemSettings {
  mongodbUri: string;
  mqttBrokerUrl: string;
  mqttTelemetryTopic: string;
  port: string;
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const res = await fetch(`${getApiBaseUrl()}/settings`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch settings');
  return data.data;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>) {
  const res = await fetch(`${getApiBaseUrl()}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update settings');
  return data;
}
