import { create } from 'zustand';
import { api, type TestResultResponse, type TestLogItem, type AdbStatusResponse } from '../services/api';
import confetti from 'canvas-confetti';

interface TestStoreState {
  // IP Connection
  tvIpAddress: string;
  isIpConnecting: boolean;
  isIpConnected: boolean;
  connectedIpTarget: string | null;
  connectionType: 'USB' | 'TCP' | 'NONE';
  isAutoDetecting: boolean;
  isScanningWifi: boolean;
  ipConnectionMessage: string | null;

  // TV Info
  serialNumber: string;
  modelName: string;

  // Execution state
  isRunningTest: boolean;
  activeStepIndex: number; // 0=idle, 1=adb, 2=hardware, 3=auth, 4=done, 5=cable, 6=channel, 7=transponders
  lastResult: TestResultResponse | null;
  error: string | null;
  autoScanTransponders: boolean;

  // External data
  adbStatus: AdbStatusResponse | null;
  recentTests: TestLogItem[];
  recentTotal: number;
  recentFilter: string;
  recentSearch: string;

  // Selected for log modal
  selectedTestForLog: TestLogItem | null;

  // Actions
  setTvIpAddress: (ip: string) => void;
  connectTvByIp: () => Promise<void>;
  disconnectTvByIp: () => Promise<void>;

  setSerialNumber: (sn: string) => void;
  setModelName: (model: string) => void;
  setRecentFilter: (filter: string) => void;
  setRecentSearch: (search: string) => void;
  setSelectedTestForLog: (test: TestLogItem | null) => void;
  setAutoScanTransponders: (enabled: boolean) => void;

  fetchAdbStatus: () => Promise<void>;
  autoDetectTv: () => Promise<void>;
  scanWifiNetwork: () => Promise<void>;
  fetchRecentTests: () => Promise<void>;
  reconnectAdb: () => Promise<void>;
  executeTest: () => Promise<void>;
}

export const useTestStore = create<TestStoreState>((set, get) => ({
  tvIpAddress: '',
  isIpConnecting: false,
  isIpConnected: false,
  connectedIpTarget: null,
  connectionType: 'NONE',
  isAutoDetecting: false,
  isScanningWifi: false,
  ipConnectionMessage: null,

  serialNumber: '',
  modelName: '',

  isRunningTest: false,
  activeStepIndex: 0,
  lastResult: null,
  error: null,
  autoScanTransponders: true,

  adbStatus: null,
  recentTests: [],
  recentTotal: 0,
  recentFilter: 'ALL',
  recentSearch: '',
  selectedTestForLog: null,

  setTvIpAddress: (ip) => set({ tvIpAddress: ip, ipConnectionMessage: null }),

  connectTvByIp: async () => {
    const { tvIpAddress } = get();
    if (!tvIpAddress.trim()) {
      set({ error: 'Пожалуйста, введите IP адрес телевизора' });
      return;
    }

    set({ isIpConnecting: true, error: null, ipConnectionMessage: null });
    try {
      const res = await api.connectAdbIp(tvIpAddress.trim());
      if (res.success) {
        set({
          isIpConnected: true,
          connectedIpTarget: res.target,
          ipConnectionMessage: res.message,
          isIpConnecting: false
        });
        await get().fetchAdbStatus();
      } else {
        set({
          isIpConnected: false,
          ipConnectionMessage: res.message,
          isIpConnecting: false,
          error: res.message
        });
      }
    } catch (err: any) {
      set({
        isIpConnected: false,
        isIpConnecting: false,
        error: err.message || 'Ошибка подключения к указанному IP',
        ipConnectionMessage: err.message
      });
    }
  },

  disconnectTvByIp: async () => {
    const { tvIpAddress, connectedIpTarget } = get();
    const target = connectedIpTarget || tvIpAddress;
    try {
      await api.disconnectAdbIp(target);
      set({
        isIpConnected: false,
        connectedIpTarget: null,
        ipConnectionMessage: `Отключено от ${target}`
      });
      await get().fetchAdbStatus();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  setSerialNumber: (sn) => set({ serialNumber: sn }),
  setModelName: (model) => set({ modelName: model }),
  setRecentFilter: (filter) => {
    set({ recentFilter: filter });
    get().fetchRecentTests();
  },
  setRecentSearch: (search) => {
    set({ recentSearch: search });
    get().fetchRecentTests();
  },
  setSelectedTestForLog: (test) => set({ selectedTestForLog: test }),
  setAutoScanTransponders: (enabled) => set({ autoScanTransponders: enabled }),

  fetchAdbStatus: async () => {
    try {
      const status = await api.getAdbStatus();
      set({ adbStatus: status });

      if (status.connected && status.devices.length > 0) {
        const dev = status.active_device || status.devices[0];
        const isUsb = dev.connectionType === 'USB' || !dev.id.includes(':');
        const connType: 'USB' | 'TCP' = isUsb ? 'USB' : 'TCP';

        set({
          isIpConnected: true,
          connectionType: connType,
          connectedIpTarget: dev.id,
          ipConnectionMessage: isUsb
            ? `✓ ТВ обнаружен по USB (${dev.model || dev.id})${dev.ip ? ` • Сетевой IP: ${dev.ip}` : ''}`
            : `✓ ТВ подключен по сети (${dev.id}${dev.model ? ` • ${dev.model}` : ''})`
        });

        // Auto-fill IP if not set
        if (dev.ip && !get().tvIpAddress) {
          set({ tvIpAddress: dev.ip });
        } else if (dev.id.includes(':') && !get().tvIpAddress) {
          set({ tvIpAddress: dev.id.split(':')[0] });
        }

        // Auto-fill Model name if empty
        if (dev.model && !get().modelName) {
          set({ modelName: dev.model });
        }

        // Auto-fill Serial Number from TV if empty and detected
        if (dev.serial_number && dev.serial_number !== 'unknown' && !get().serialNumber) {
          set({ serialNumber: dev.serial_number.toUpperCase() });
        }
      } else {
        if (get().isIpConnected) {
          set({
            isIpConnected: false,
            connectionType: 'NONE',
            connectedIpTarget: null,
            ipConnectionMessage: 'Ожидание подключения ТВ (USB-кабель с отладкой или локальная сеть)...'
          });
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch ADB status:', e);
    }
  },

  autoDetectTv: async () => {
    set({ isAutoDetecting: true, error: null });
    try {
      const res = await api.autoDetectAdb();
      await get().fetchAdbStatus();
      set({ isAutoDetecting: false, ipConnectionMessage: res.message });
    } catch (err: any) {
      set({ isAutoDetecting: false, error: err.message || 'Ошибка автоопределения' });
    }
  },

  scanWifiNetwork: async () => {
    set({ isScanningWifi: true, error: null });
    try {
      const res = await api.scanWifiAdb();
      await get().fetchAdbStatus();
      set({ isScanningWifi: false, ipConnectionMessage: res.message });
    } catch (err: any) {
      set({ isScanningWifi: false, error: err.message || 'Ошибка поиска в Wi-Fi сети' });
    }
  },

  fetchRecentTests: async () => {
    try {
      const { recentFilter, recentSearch } = get();
      const data = await api.getRecentTests({
        limit: 50,
        result: recentFilter,
        search: recentSearch
      });
      set({ recentTests: data.items, recentTotal: data.total });
    } catch (e: any) {
      console.error('Failed to fetch recent tests:', e);
    }
  },

  reconnectAdb: async () => {
    try {
      await api.reconnectAdb();
      await get().fetchAdbStatus();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  executeTest: async () => {
    const { serialNumber, modelName, tvIpAddress, connectedIpTarget, isIpConnected, autoScanTransponders, adbStatus } = get();

    let effectiveSerial = serialNumber.trim();
    if (!effectiveSerial) {
      const detectedSn = adbStatus?.active_serial;
      if (detectedSn && detectedSn !== 'unknown') {
        effectiveSerial = detectedSn.toUpperCase();
        set({ serialNumber: effectiveSerial });
      } else {
        set({ error: 'Пожалуйста, введите или отсканируйте серийный номер ТВ (S/N)' });
        return;
      }
    }

    const targetDevice = isIpConnected ? (connectedIpTarget || undefined) : (tvIpAddress.trim() || undefined);

    set({
      isRunningTest: true,
      error: null,
      lastResult: null,
      activeStepIndex: 1 // 1: ADB Check & Wakeup
    });

    try {
      const step1Timer = setTimeout(() => {
        set({ activeStepIndex: 2 }); // 2: Hardware dmesg / ca0 check
      }, 700);

      const step2Timer = setTimeout(() => {
        set({ activeStepIndex: 3 }); // 3: CAM info & slot contacts
      }, 1600);

      const step3Timer = setTimeout(() => {
        set({ activeStepIndex: 4 }); // 4: CI+ Auth / SAC
      }, 2600);

      const step4Timer = setTimeout(() => {
        set({ activeStepIndex: 5 }); // 5: Satellite cable & RF signal
      }, 3800);

      const step5Timer = setTimeout(() => {
        set({ activeStepIndex: 6 }); // 6: Paid channel descrambler
      }, 5000);

      const step6Timer = setTimeout(() => {
        if (autoScanTransponders) {
          set({ activeStepIndex: 7 }); // 7: KazSat-3 Transponders auto-scan
        }
      }, 6200);

      const result = await api.runTest({
        serial_number: effectiveSerial,
        ip_address: targetDevice,
        model_name: modelName.trim() || 'Smart TV',
        auto_scan_transponders: autoScanTransponders
      });

      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
      clearTimeout(step5Timer);
      clearTimeout(step6Timer);

      set({
        isRunningTest: false,
        activeStepIndex: 7, // Complete
        lastResult: result
      });

      if (result.test_result === 'PASS') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#10b981', '#38bdf8']
        });
      }

      get().fetchRecentTests();
    } catch (err: any) {
      const fallbackResult = {
        success: false,
        test_id: 0,
        device_id: 0,
        serial_number: serialNumber.trim(),
        model_name: modelName.trim() || 'Smart TV',
        ip_address: targetDevice,
        hardware_detected: false,
        auth_status: 'FAIL' as const,
        cam_info_read: false,
        cam_model_name: null,
        raw_adb_log: `[ОШИБКА ВЫПОЛНЕНИЯ / ОШИБКА ADB]\n${err.message || err}\n\nЦелевой ТВ: ${targetDevice || 'USB / Не указан'}\nВремя: ${new Date().toISOString()}`,
        test_result: 'FAIL' as const,
        failure_reason: err.message || 'Ошибка выполнения',
        step_timeline: [
          {
            step: 'ERROR',
            status: 'FAIL' as const,
            message: err.message || 'Ошибка',
            timestamp: new Date().toISOString()
          }
        ],
        execution_time_ms: 0
      };

      set({
        isRunningTest: false,
        activeStepIndex: 4,
        error: err.message || 'Ошибка выполнения теста',
        lastResult: fallbackResult
      });
      get().fetchRecentTests();
    }
  }
}));
