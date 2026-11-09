export interface RunTestPayload {
  serial_number: string;
  ip_address?: string;
  model_name?: string;
  auto_scan_transponders?: boolean;
}

export interface StepTimelineItem {
  step: string;
  status: 'SUCCESS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string;
  timestamp: string;
}

export interface SatelliteSignalMetrics {
  strength: number;
  quality: number;
  snr: number;
  ber: number;
  dbm?: number;
  lock_status: string;
  frequency?: number;
  cable_status: 'CONNECTED' | 'DISCONNECTED' | 'POOR_SIGNAL';
}

export interface OtauTransponderScanResult {
  frequency: number;
  polarization: 'H' | 'V';
  symbolRate: number;
  lockStatus: 'LOCKED' | 'UNLOCKED';
  signalLevel: number;
  signalQuality: number;
  channelsFound: number;
  channels: string[];
  package: string;
  scanDurationMs: number;
}

export interface TransponderAutoScanSummary {
  enabled: boolean;
  totalTransponders: number;
  lockedTransponders: number;
  totalChannelsFound: number;
  transponders: OtauTransponderScanResult[];
  scanCompleted: boolean;
  statusText: string;
}

export interface TestResultResponse {
  success: boolean;
  test_id: number;
  device_id: number;
  serial_number: string;
  model_name: string;
  ip_address?: string;
  hardware_detected: boolean;
  auth_status: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
  cam_info_read: boolean;
  cam_model_name: string | null;
  cam_diagnostic_state?: string;
  master_cam_warning?: string | null;
  satellite_signal?: SatelliteSignalMetrics;
  transponder_scan?: TransponderAutoScanSummary;
  raw_adb_log: string;
  test_result: 'PASS' | 'FAIL';
  failure_reason: string | null;
  step_timeline: StepTimelineItem[];
  execution_time_ms: number;
}

export interface TestLogItem {
  id: number;
  device_id: number;
  ip_address?: string;
  serial_number: string;
  model_name: string;
  hardware_detected: number | boolean;
  auth_status: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
  cam_info_read: number | boolean;
  test_result: 'PASS' | 'FAIL';
  failure_reason: string | null;
  cam_model_name: string | null;
  master_cam_warning?: string | null;
  satellite_signal?: SatelliteSignalMetrics;
  transponder_scan?: TransponderAutoScanSummary;
  tested_at: string;
  raw_adb_log?: string;
}

export interface AdbDeviceItem {
  id: string;
  type: string;
  connectionType?: 'USB' | 'TCP';
  ip?: string;
  model?: string;
  product?: string;
  manufacturer?: string;
  serial_number?: string;
}

export interface AdbStatusResponse {
  connected: boolean;
  connection_type?: 'USB' | 'TCP' | 'NONE';
  devices: AdbDeviceItem[];
  active_device?: AdbDeviceItem | null;
  adbVersion: string;
  active_model?: string | null;
  active_serial?: string | null;
  active_ip?: string | null;
}

const API_BASE = '/api';

export const api = {
  async runTest(payload: RunTestPayload): Promise<TestResultResponse> {
    const res = await fetch(`${API_BASE}/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Сетевая ошибка' }));
      throw new Error(err.error || 'Ошибка при запуске теста');
    }
    return res.json();
  },

  async getRecentTests(params?: {
    limit?: number;
    offset?: number;
    result?: string;
    search?: string;
  }): Promise<{ items: TestLogItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    if (params?.result && params.result !== 'ALL') query.append('result', params.result);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/tests/recent?${query.toString()}`);
    if (!res.ok) throw new Error('Ошибка загрузки истории тестов');
    return res.json();
  },

  async getTestById(id: number): Promise<TestLogItem> {
    const res = await fetch(`${API_BASE}/tests/${id}`);
    if (!res.ok) throw new Error('Тест не найден');
    return res.json();
  },

  async getAdbStatus(): Promise<AdbStatusResponse> {
    const res = await fetch(`${API_BASE}/adb/status`);
    if (!res.ok) throw new Error('Ошибка проверки статуса ADB');
    return res.json();
  },

  async autoDetectAdb(): Promise<{
    connected: boolean;
    connectionType: 'USB' | 'TCP' | 'NONE';
    device: AdbDeviceItem | null;
    message: string;
    allDevices: AdbDeviceItem[];
  }> {
    const res = await fetch(`${API_BASE}/adb/auto-detect`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Ошибка автоопределения ADB');
    return res.json();
  },

  async scanWifiAdb(): Promise<{
    success: boolean;
    discovered: Array<{
      ip: string;
      port: number;
      target: string;
      model?: string;
      manufacturer?: string;
      serial_number?: string;
      source: string;
    }>;
    connectedDevice: AdbDeviceItem | null;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/adb/scan-wifi`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Ошибка сканирования Wi-Fi сети');
    return res.json();
  },

  async reconnectAdb(): Promise<{ success: boolean; devices: any[] }> {
    const res = await fetch(`${API_BASE}/adb/reconnect`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Ошибка перезапуска службы ADB');
    return res.json();
  },

  async connectAdbIp(ip: string): Promise<{
    success: boolean;
    message: string;
    target: string;
    model_name?: string;
    manufacturer?: string;
    serial_number?: string;
    devices: any[];
  }> {
    const res = await fetch(`${API_BASE}/adb/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Ошибка подключения по IP');
    }
    return data;
  },

  async disconnectAdbIp(ip: string): Promise<{ success: boolean; message: string; devices: any[] }> {
    const res = await fetch(`${API_BASE}/adb/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Ошибка отключения от IP');
    }
    return data;
  }
};
