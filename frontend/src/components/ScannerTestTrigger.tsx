import React, { useRef, useEffect, useState } from 'react';
import { useTestStore } from '../store/useTestStore';
import { 
  Barcode, 
  Play, 
  Loader2, 
  AlertCircle, 
  Wifi, 
  CheckCircle2, 
  Unlink, 
  Radio,
  Tv,
  FileText,
  Satellite,
  Usb,
  RefreshCw,
  Search,
  Globe
} from 'lucide-react';

export const ScannerTestTrigger: React.FC = () => {
  const {
    tvIpAddress,
    setTvIpAddress,
    isIpConnecting,
    isIpConnected,
    connectedIpTarget,
    connectionType,
    isAutoDetecting,
    isScanningWifi,
    ipConnectionMessage,
    connectTvByIp,
    disconnectTvByIp,
    autoDetectTv,
    scanWifiNetwork,
    adbStatus,
    serialNumber,
    setSerialNumber,
    modelName,
    setModelName,
    isRunningTest,
    executeTest,
    error,
    lastResult,
    setSelectedTestForLog,
    autoScanTransponders,
    setAutoScanTransponders
  } = useTestStore();

  const [showManualIp, setShowManualIp] = useState(false);
  const ipInputRef = useRef<HTMLInputElement>(null);
  const serialInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isIpConnected) {
      serialInputRef.current?.focus();
    } else {
      ipInputRef.current?.focus();
    }
  }, [isIpConnected]);

  const handleIpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isIpConnecting) {
      connectTvByIp();
    }
  };

  const handleSerialKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunningTest) {
      executeTest();
    }
  };

  return (
    <div className="glass-panel scanner-zone">
      <div className="panel-header" style={{ marginBottom: 12 }}>
        <h2 className="panel-title">
          <Tv size={22} style={{ color: '#00f2fe' }} />
          <span>Параметры Подключения & Тестирования ТВ</span>
        </h2>
      </div>

      {/* 1. TV Connection (USB & Network Auto-Detection) */}
      <div 
        style={{
          background: isIpConnected 
            ? (connectionType === 'USB' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.06)')
            : 'rgba(245, 158, 11, 0.05)',
          border: isIpConnected 
            ? (connectionType === 'USB' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 242, 254, 0.35)')
            : '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            {connectionType === 'USB' ? (
              <Usb size={19} style={{ color: '#10b981' }} />
            ) : (
              <Wifi size={19} style={{ color: isIpConnected ? '#00f2fe' : '#fbbf24' }} />
            )}
            <span>1. Подключение к ТВ (Автоматическое распознавание USB & Сеть)</span>
          </label>

          {isIpConnected ? (
            <span 
              style={{ 
                color: connectionType === 'USB' ? '#34d399' : '#38bdf8', 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                fontWeight: 700,
                background: connectionType === 'USB' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 242, 254, 0.15)',
                padding: '4px 10px',
                borderRadius: 12,
                border: `1px solid ${connectionType === 'USB' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 242, 254, 0.3)'}`
              }}
            >
              <CheckCircle2 size={14} />
              {connectionType === 'USB' ? '🔌 USB-РЕЖИМ (ОТЛАДКА ПО USB)' : `📶 СЕТЬ: ${connectedIpTarget}`}
            </span>
          ) : (
            <span 
              style={{ 
                color: '#fbbf24', 
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '4px 8px',
                borderRadius: 12
              }}
            >
              <span className="pulse-dot simulated" style={{ width: 8, height: 8 }} />
              Ожидание ТВ (USB / Сеть)
            </span>
          )}
        </div>

        {/* Connected TV Info Banner */}
        {isIpConnected ? (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{adbStatus?.active_model || modelName || 'Android Smart TV'}</span>
                {adbStatus?.active_serial && (
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    (S/N: {adbStatus.active_serial})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 3 }}>
                Канал ADB: <strong style={{ color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>{connectedIpTarget}</strong>
                {connectionType === 'USB' && tvIpAddress && (
                  <span style={{ marginLeft: 8, color: '#34d399' }}>
                    • Сетевой IP: {tvIpAddress}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => scanWifiNetwork()}
                disabled={isScanningWifi}
                title="Поиск ТВ в локальной Wi-Fi сети (mDNS & порт 5555)"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8'
                }}
              >
                <Globe size={14} className={isScanningWifi ? 'spin-animation' : undefined} />
                <span>{isScanningWifi ? 'Поиск Wi-Fi...' : 'Wi-Fi скан'}</span>
              </button>

              <button
                type="button"
                className="btn-icon-action"
                onClick={() => autoDetectTv()}
                disabled={isAutoDetecting}
                title="Пересканировать USB и сетевые устройства"
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} className={isAutoDetecting ? 'spin-animation' : undefined} />
                <span>{isAutoDetecting ? 'Поиск...' : 'Скан'}</span>
              </button>

              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setShowManualIp(!showManualIp)}
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                <Wifi size={14} />
                <span>{showManualIp ? 'Скрыть IP' : 'Сменить IP'}</span>
              </button>

              <button
                type="button"
                className="btn-icon-action"
                onClick={() => disconnectTvByIp()}
                style={{
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  color: '#fb7185',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  background: 'rgba(244, 63, 94, 0.12)'
                }}
              >
                <Unlink size={14} />
                <span>Отключить</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.45 }}>
              ⚡ <strong>Автоподключение активно:</strong> стенд автоматически находит телевизор по <strong>USB-кабелю</strong> или в <strong>Wi-Fi сети</strong> (по протоколу mDNS и порту 5555). Ручной ввод IP не требуется.
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => scanWifiNetwork()}
                disabled={isScanningWifi}
                style={{
                  borderColor: 'rgba(56, 189, 248, 0.5)',
                  color: '#38bdf8',
                  padding: '9px 16px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  fontWeight: 600,
                  fontSize: '0.84rem'
                }}
              >
                {isScanningWifi ? (
                  <>
                    <Loader2 size={15} className="spin-animation" />
                    <span>Сканирование Wi-Fi сети...</span>
                  </>
                ) : (
                  <>
                    <Globe size={15} />
                    <span>🌐 Автопоиск в Wi-Fi сети</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-icon-action"
                onClick={() => autoDetectTv()}
                disabled={isAutoDetecting}
                style={{
                  borderColor: 'rgba(0, 242, 254, 0.4)',
                  color: 'var(--accent-cyan)',
                  padding: '9px 16px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  fontWeight: 600,
                  fontSize: '0.84rem'
                }}
              >
                {isAutoDetecting ? (
                  <>
                    <Loader2 size={15} className="spin-animation" />
                    <span>Поиск USB...</span>
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    <span>Найти по USB</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setShowManualIp(!showManualIp)}
                style={{ padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <Wifi size={15} />
                <span>{showManualIp ? 'Скрыть ручной ввод' : 'Ввести IP вручную'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Optional Manual IP Input (Shown if not connected or user clicked toggle) */}
        {(showManualIp || !isIpConnected) && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={ipInputRef}
                type="text"
                className="custom-text-input"
                style={{
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '10px 14px',
                  borderColor: isIpConnected ? 'rgba(16, 185, 129, 0.5)' : undefined,
                  color: isIpConnected ? '#34d399' : '#fff'
                }}
                placeholder="Ручной ввод IP (например: 192.168.211.88)"
                value={tvIpAddress}
                onChange={(e) => setTvIpAddress(e.target.value)}
                onKeyDown={handleIpKeyDown}
                disabled={isIpConnecting}
              />
            </div>

            <button
              type="button"
              className="btn-icon-action"
              onClick={() => connectTvByIp()}
              disabled={isIpConnecting || !tvIpAddress.trim()}
              style={{
                borderColor: 'rgba(0, 242, 254, 0.4)',
                color: 'var(--accent-cyan)',
                padding: '10px 18px',
                background: 'rgba(0, 242, 254, 0.15)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {isIpConnecting ? (
                <>
                  <Loader2 size={15} className="spin-animation" />
                  <span>Подключение...</span>
                </>
              ) : (
                <>
                  <Radio size={15} />
                  <span>Подключить IP</span>
                </>
              )}
            </button>
          </div>
        )}

        {ipConnectionMessage && (
          <div style={{ fontSize: '0.8rem', color: isIpConnected ? '#34d399' : '#fbbf24' }}>
            {ipConnectionMessage}
          </div>
        )}
      </div>

      {/* 2. Serial Number & Model Number Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div className="input-group">
          <label className="input-label">
            <span>2. СЕРИЙНЫЙ НОМЕР (S/N)</span>
          </label>
          <div className="barcode-input-wrapper">
            <Barcode size={24} className="barcode-input-icon" />
            <input
              ref={serialInputRef}
              type="text"
              className="barcode-input"
              style={{ fontSize: '1.1rem', padding: '13px 18px 13px 48px' }}
              placeholder="Серийный номер ТВ..."
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              onKeyDown={handleSerialKeyDown}
              disabled={isRunningTest}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">
            <span>МОДЕЛЬ (MODEL NUMBER)</span>
          </label>
          <input
            type="text"
            className="custom-text-input"
            style={{ padding: '15px 16px', fontSize: '1rem' }}
            placeholder="Например: OLED-55C3 или 43AU7100"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={isRunningTest}
          />
        </div>
      </div>

      {/* 3. KazSat-3 Transponders Auto-Scan Toggle */}
      <div
        onClick={() => !isRunningTest && setAutoScanTransponders(!autoScanTransponders)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: autoScanTransponders ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          border: autoScanTransponders ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          cursor: isRunningTest ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: autoScanTransponders ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: autoScanTransponders ? '#00f2fe' : '#64748b'
            }}
          >
            <Satellite size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: autoScanTransponders ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Автодобавление базового пакета ОТАУ ТВ (KazSat-3 58.5°E)</span>
              {autoScanTransponders && (
                <span style={{ fontSize: '0.72rem', background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                  30 КАНАЛОВ
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
              Автоматический поиск по базовой частоте KazSat-3 (10762 H 30000) — национальный пакет 30 каналов
            </div>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <div
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: autoScanTransponders ? '#00f2fe' : 'rgba(255, 255, 255, 0.2)',
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#0a0e17',
              position: 'absolute',
              top: 2,
              left: autoScanTransponders ? 22 : 2,
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
            }}
          />
        </div>
      </div>

      {error && (
        <div 
          style={{ 
            color: '#fb7185', 
            fontSize: '0.86rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>

          {lastResult && (
            <button
              type="button"
              className="btn-icon-action"
              onClick={() => setSelectedTestForLog(lastResult as any)}
              style={{
                borderColor: 'rgba(244, 63, 94, 0.5)',
                color: '#fff',
                background: 'rgba(244, 63, 94, 0.25)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                flexShrink: 0
              }}
            >
              <FileText size={14} />
              <span>Посмотреть лог</span>
            </button>
          )}
        </div>
      )}

      {/* Big Trigger Button */}
      <button
        type="button"
        className="btn-trigger-test"
        onClick={() => executeTest()}
        disabled={isRunningTest || (!serialNumber.trim() && !adbStatus?.active_serial)}
      >
        {isRunningTest ? (
          <>
            <Loader2 size={24} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            <span>ВЫПОЛНЯЕТСЯ ПРОВЕРКА ЧЕРЕЗ ADB НА ТВ...</span>
          </>
        ) : (
          <>
            <Play size={24} fill="currentColor" />
            <span>
              {connectionType === 'USB' ? 'ЗАПУСТИТЬ ТЕСТ ПО USB' : 'ЗАПУСТИТЬ ТЕСТ ЧЕРЕЗ ADB'}
            </span>
            {isIpConnected && (
              <span style={{ fontSize: '0.82rem', opacity: 0.9, fontWeight: 500 }}>
                ({connectionType === 'USB' ? `USB: ${connectedIpTarget}` : (connectedIpTarget || tvIpAddress)})
              </span>
            )}
            <span className="btn-shortcut-hint">[ENTER]</span>
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
