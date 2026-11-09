import React from 'react';
import { useTestStore } from '../store/useTestStore';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { translateFailureReason } from '../utils/failureTranslation';

export const LiveProcessSteps: React.FC = () => {
  const { activeStepIndex, isRunningTest, lastResult, setSelectedTestForLog } = useTestStore();
  const failureInfo = lastResult && lastResult.test_result === 'FAIL' ? translateFailureReason(lastResult.failure_reason) : null;

  const getStepStatus = (index: number) => {
    if (isRunningTest) {
      if (activeStepIndex === index) return 'active';
      if (activeStepIndex > index) return 'success';
      return 'pending';
    }

    if (lastResult) {
      if (index === 1) return 'success'; // adb connect
      if (index === 2) return lastResult.hardware_detected ? 'success' : 'failed';
      if (index === 3) return lastResult.cam_info_read ? 'success' : 'failed';
      if (index === 4) return lastResult.auth_status === 'SUCCESS' ? 'success' : 'failed';
      if (index === 5) return (lastResult.test_result === 'PASS' || lastResult.failure_reason !== 'SATELLITE_SIGNAL_LOST') ? 'success' : 'failed';
      if (index === 6) return (lastResult.test_result === 'PASS' || (lastResult.failure_reason !== 'PAID_CHANNELS_DESCRAMBLING_FAILED' && lastResult.auth_status === 'SUCCESS')) ? 'success' : 'failed';
      if (index === 7) {
        if (!lastResult.transponder_scan) return lastResult.test_result === 'PASS' ? 'success' : 'pending';
        return lastResult.transponder_scan.scanCompleted && lastResult.transponder_scan.lockedTransponders > 0 ? 'success' : 'failed';
      }
      if (index === 8) {
        return lastResult.test_result === 'PASS' ? 'success' : (lastResult.step_timeline?.some(s => s.step === 'CHANNEL_PLAYBACK_VERIFY') ? 'success' : 'pending');
      }
    }

    return 'pending';
  };

  const steps = [
    {
      id: 1,
      title: 'Подключение по ADB & Пробуждение',
      command: 'adb connect <ip> && input keyevent KEYCODE_WAKEUP',
      desc: 'Проверка доступности Android TV по TCP/IP и готовность системы'
    },
    {
      id: 2,
      title: 'Аппаратный DVB / CA узел и Card Detect',
      command: 'ls -la /dev/dvb0.ca0 && dmesg | grep aml_pcmcia',
      desc: 'Опрос ядра, пинов Card Detect шины PCMCIA (CD1/CD2) и питания слота 5V'
    },
    {
      id: 3,
      title: 'Идентификация CAM-модуля (Без подписки)',
      command: 'DvbCiService / CIPlusManager: onCIMenuStatus',
      desc: 'Фоновое считывание паспорта карты (OTAU tvcom CI+), баланс и подписка не требуются'
    },
    {
      id: 4,
      title: 'CI+ Аутентификация в логах (SAC)',
      command: 'logcat -s CIPlusService,DvbCiService: SAC established',
      desc: 'Проверка взаимного обмена крипто-сертификатами ТВ и слота в фоновом режиме'
    },
    {
      id: 5,
      title: 'Спутниковый кабель и ВЧ-сигнал (KazSat-3 DVB-S2)',
      command: lastResult?.satellite_signal
        ? `Кабель LNB: Уровень ${lastResult.satellite_signal.strength}% | Качество ${lastResult.satellite_signal.quality}% (${lastResult.satellite_signal.lock_status})`
        : 'Проверка подключения кабеля LNB, уровня мощности и качества',
      desc: lastResult?.satellite_signal
        ? `SNR: ${lastResult.satellite_signal.snr} dB, Ошибки BER: ${lastResult.satellite_signal.ber}, Статус: ${lastResult.satellite_signal.cable_status === 'CONNECTED' ? 'Кабель надежно подключен' : 'Обрыв или слабый контакт'}`
        : 'Контроль надежности подключения кабеля спутниковой антенны к разъему LNB IN, уровня (SSI) и качества (SQI)'
    },
    {
      id: 6,
      title: 'Платный закрытый канал (Дескремблирование CI/CI+)',
      command: 'TS Transport Stream & ECM Descramble Check',
      desc: 'Проверка шины данных TS слота PCMCIA и ответа дескремблера на платный поток'
    },
    {
      id: 7,
      title: 'Автонастройка каналов ОТАУ ТВ (Базовый пакет 30 каналов)',
      command: lastResult?.transponder_scan
        ? `KazSat-3 58.5°E: Залочено ${lastResult.transponder_scan.lockedTransponders}/${lastResult.transponder_scan.totalTransponders} • ${lastResult.transponder_scan.totalChannelsFound} каналов`
        : 'Сканирование базовой частоты: 10762 H 30000 (KazSat-3)',
      desc: lastResult?.transponder_scan
        ? `Запрограммировано ${lastResult.transponder_scan.totalChannelsFound} каналов базового пакета ОТАУ ТВ (10762 H 30000).`
        : 'Автоматический поиск по базовому транспондеру KazSat-3 58.5°E (30 телерадиоканалов ОТАУ ТВ)'
    },
    {
      id: 8,
      title: 'Контрольный запуск телеканала со звуком 70% (ОТК)',
      command: 'STREAM_MUSIC: 70% | com.mitv.livetv (OTAU TV)',
      desc: 'Автоматический вывод эфирного канала со звуком 70% для физической проверки сотрудником ОТК'
    }
  ];

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <Terminal size={22} style={{ color: '#00f2fe' }} />
          <span>Пошаговая Диагностика CI/CI+ Тракта</span>
        </h2>
        {lastResult && (
          <button
            className="btn-icon-action"
            onClick={() => setSelectedTestForLog(lastResult as any)}
            title="Открыть полный дамп логов ADB для инженера"
          >
            <FileText size={14} />
            <span>Сырой ADB Log</span>
          </button>
        )}
      </div>

      <div className="pipeline-steps">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className={`step-card ${status}`}>
              <div className="step-icon-box">
                {status === 'success' && <CheckCircle2 size={20} />}
                {status === 'failed' && <XCircle size={20} />}
                {status === 'active' && <Cpu size={20} className="spin-animation" />}
                {status === 'pending' && <Clock size={20} />}
              </div>
              <div className="step-content">
                <div className="step-title-row">
                  <span className="step-name">{step.title}</span>
                  <span className="step-command">{step.command}</span>
                </div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome Banner (PASS / FAIL) */}
      {lastResult && (
        <div className={`outcome-banner ${lastResult.test_result.toLowerCase()}`}>
          <div className="outcome-title-wrap">
            <div className="outcome-icon">
              {lastResult.test_result === 'PASS' ? (
                <ShieldCheck size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>
            <div>
              <div className="outcome-badge-text">
                {lastResult.test_result === 'PASS' ? 'ГОДЕН (PASS)' : 'БРАК (FAIL)'}
              </div>
              <div className="outcome-subtitle">
                {lastResult.test_result === 'PASS' ? (
                  <span>
                    CAM: <strong>{lastResult.cam_model_name || 'CI+ 1.4 Module'}</strong> • Все тесты пройдены успешно ({lastResult.execution_time_ms} мс)
                  </span>
                ) : (
                  <div style={{ color: '#fb7185', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                    <div>
                      <strong style={{ color: '#ffd166' }}>{failureInfo?.stage}: </strong>
                      <span style={{ color: '#fff' }}>{failureInfo?.defect}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                      Действие: {failureInfo?.action}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            className="btn-icon-action"
            style={{ 
              padding: '12px 20px', 
              background: lastResult.test_result === 'PASS' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.3)', 
              borderColor: lastResult.test_result === 'PASS' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.7)',
              color: '#fff',
              fontWeight: 600,
              boxShadow: lastResult.test_result === 'PASS' ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(244, 63, 94, 0.35)'
            }}
            onClick={() => setSelectedTestForLog(lastResult as any)}
          >
            <FileText size={18} />
            <span>{lastResult.test_result === 'PASS' ? 'Лог проверки' : '📋 Просмотреть лог ошибки'}</span>
          </button>
        </div>
      )}

      {/* Satellite Cable Telemetry Banner */}
      {lastResult?.satellite_signal && (
        <div
          style={{
            marginTop: 12,
            background: 'rgba(15, 23, 42, 0.7)',
            border: `1px solid ${lastResult.satellite_signal.cable_status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.1rem' }}>📡</span>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>АНТЕННЫЙ КАБЕЛЬ LNB IN</div>
              <strong style={{ color: lastResult.satellite_signal.cable_status === 'CONNECTED' ? '#10b981' : '#f43f5e' }}>
                {lastResult.satellite_signal.cable_status === 'CONNECTED' ? '✓ КАБЕЛЬ ПОДКЛЮЧЕН (СИГНАЛ В НОРМЕ)' : '✕ ОБРЫВ / НЕТ СИГНАЛА'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>УРОВЕНЬ</span>
              <strong style={{ color: '#00f2fe' }}>{lastResult.satellite_signal.strength}%</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>КАЧЕСТВО</span>
              <strong style={{ color: '#10b981' }}>{lastResult.satellite_signal.quality}%</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>SNR</span>
              <strong style={{ color: '#cbd5e1' }}>{lastResult.satellite_signal.snr} dB</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>ОШИБКИ BER</span>
              <strong style={{ color: lastResult.satellite_signal.ber === 0 ? '#10b981' : '#f59e0b' }}>
                {lastResult.satellite_signal.ber}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Transponder Auto-Scan Telemetry Banner */}
      {lastResult?.transponder_scan && (
        <div
          style={{
            marginTop: 10,
            background: 'rgba(15, 23, 42, 0.7)',
            border: `1px solid ${lastResult.transponder_scan.scanCompleted ? 'rgba(0, 242, 254, 0.35)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>🛰️</span>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>АВТОНАСТРОЙКА КАНАЛОВ KAZSAT-3 (58.5°E)</div>
                <strong style={{ color: lastResult.transponder_scan.scanCompleted ? '#00f2fe' : '#f43f5e' }}>
                  {lastResult.transponder_scan.scanCompleted
                    ? `✓ НАСТРОЕНО ${lastResult.transponder_scan.lockedTransponders} ИЗ ${lastResult.transponder_scan.totalTransponders} ТРАНСПОНДЕРОВ (${lastResult.transponder_scan.totalChannelsFound} КАНАЛОВ)`
                    : `✕ ЗАЛОЧЕНО ${lastResult.transponder_scan.lockedTransponders}/${lastResult.transponder_scan.totalTransponders} ТРАНСПОНДЕРОВ`}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ИТОГО КАНАЛОВ:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {lastResult.transponder_scan.totalChannelsFound}
              </span>
            </div>
          </div>

          {/* Transponder Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lastResult.transponder_scan.transponders.map((tp) => {
              const isLocked = tp.lockStatus === 'LOCKED';
              return (
                <div
                  key={tp.frequency}
                  style={{
                    background: isLocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                    border: `1px solid ${isLocked ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontWeight: 600, color: isLocked ? '#34d399' : '#fb7185' }}>
                    {tp.frequency} {tp.polarization}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{tp.channelsFound} кан.</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Master CAM Health Warning Alert */}
      {lastResult && (lastResult as any).master_cam_warning && (
        <div
          style={{
            marginTop: 12,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fbbf24',
            fontSize: '0.85rem'
          }}
        >
          <AlertTriangle size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>{(lastResult as any).master_cam_warning}</span>
        </div>
      )}
    </div>
  );
};
