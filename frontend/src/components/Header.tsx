import React from 'react';
import { useTestStore } from '../store/useTestStore';
import { Tv, Radio, RefreshCw, Usb } from 'lucide-react';

export const Header: React.FC = () => {
  const { adbStatus, reconnectAdb } = useTestStore();

  const isConnected = (adbStatus?.devices && adbStatus.devices.length > 0) ?? false;
  const device = adbStatus?.devices?.[0];
  const isUsb = device ? (device.connectionType === 'USB' || !device.id.includes(':')) : false;

  return (
    <header className="header-glass">
      <div className="brand-section">
        <div className="brand-logo-badge">
          <Tv size={26} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="brand-title">QMS-CI Test Station</h1>
          <div className="brand-subtitle">
            <span style={{ color: '#00f2fe' }}>CI/CI+ Hardware & Protocol ADB Validator</span>
            <span>•</span>
            <span>Проверка реального ТВ</span>
          </div>
        </div>
      </div>

      <div className="header-badges">
        {/* Real ADB Connection Status */}
        <div className={`status-indicator ${isConnected ? 'online' : 'simulated'}`}>
          <span className={`pulse-dot ${isConnected ? 'online' : 'simulated'}`} />
          {isUsb ? <Usb size={14} style={{ color: '#10b981' }} /> : <Radio size={14} />}
          <span>
            {isConnected
              ? (isUsb
                  ? `USB: ${device?.model || device?.id} (Отладка активна)`
                  : `Сеть: ${device?.id} ${device?.model ? `(${device.model})` : ''}`)
              : 'Ожидание ТВ (USB / Сеть)'}
          </span>
        </div>

        {/* Scan / Refresh ADB Button */}
        <button
          className="btn-icon-action"
          onClick={() => reconnectAdb()}
          title="Обновить список устройств ADB"
        >
          <RefreshCw size={14} />
          <span>Скан ADB</span>
        </button>
      </div>
    </header>
  );
};
