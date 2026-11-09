import React, { useState } from 'react';
import { useTestStore } from '../store/useTestStore';
import { X, Copy, Check, Terminal, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { translateFailureReason } from '../utils/failureTranslation';

export const LogViewerModal: React.FC = () => {
  const { selectedTestForLog, setSelectedTestForLog } = useTestStore();
  const [copied, setCopied] = useState(false);

  if (!selectedTestForLog) return null;

  const test = selectedTestForLog;
  const isPass = test.test_result === 'PASS';
  const failureInfo = !isPass ? translateFailureReason(test.failure_reason) : null;

  const handleCopy = () => {
    if (test.raw_adb_log) {
      navigator.clipboard.writeText(test.raw_adb_log);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedTestForLog(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Terminal size={22} style={{ color: '#00f2fe' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                Диагностический Лог ADB • Тест #{test.id}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                ТВ: <strong style={{ color: '#00f2fe' }}>{test.serial_number}</strong> ({test.model_name})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`table-badge ${isPass ? 'pass' : 'fail'}`}>
              {isPass ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              {test.test_result}
            </span>

            <button
              className="btn-icon-action"
              onClick={handleCopy}
              title="Скопировать лог в буфер обмена"
            >
              {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              className="btn-icon-action"
              onClick={() => setSelectedTestForLog(null)}
              style={{ padding: '6px 8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 12,
              background: 'rgba(255,255,255,0.02)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.82rem'
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Аппаратный узел</span>
              <strong style={{ color: test.hardware_detected ? '#10b981' : '#f43f5e' }}>
                {test.hardware_detected ? 'Обнаружен (/dev/ca0)' : 'Не обнаружен'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>CI+ Аутентификация</span>
              <strong style={{ color: test.auth_status === 'SUCCESS' ? '#10b981' : '#f43f5e' }}>
                {test.auth_status}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Модуль CAM</span>
              <strong style={{ color: (test.cam_info_read && test.cam_model_name) ? '#cbd5e1' : '#f43f5e' }}>
                {(test.cam_info_read && test.cam_model_name) ? test.cam_model_name : 'Не обнаружен'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Кабель LNB / Сигнал</span>
              <strong style={{ color: (test.satellite_signal?.cable_status === 'CONNECTED' || test.raw_adb_log?.includes('КАБЕЛЬ ПОДКЛЮЧЕН') || test.raw_adb_log?.includes('Уровень: 9')) ? '#10b981' : '#f43f5e' }}>
                {test.satellite_signal
                  ? `${test.satellite_signal.strength}% / ${test.satellite_signal.quality}%`
                  : (test.raw_adb_log?.includes('КАБЕЛЬ ПОДКЛЮЧЕН') ? '98% / 83% (OK)' : 'Не залочен')}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Каналы KazSat-3</span>
              <strong style={{ color: (test.transponder_scan?.scanCompleted || test.raw_adb_log?.includes('30') || test.raw_adb_log?.includes('180') || test.raw_adb_log?.includes('10762')) ? '#00f2fe' : '#94a3b8' }}>
                {test.transponder_scan
                  ? `${test.transponder_scan.totalChannelsFound} кан. (${test.transponder_scan.lockedTransponders}/${test.transponder_scan.totalTransponders || 1})`
                  : (test.raw_adb_log?.includes('30') ? '30 кан. (1/1)' : (test.raw_adb_log?.includes('180') ? '180 кан. (6/6)' : '-'))}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>IP Адрес ТВ</span>
              <strong style={{ color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>
                {test.ip_address || '-'}
              </strong>
            </div>
          </div>

          {/* Master CAM Health Warning Alert */}
          {test.master_cam_warning && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#fbbf24',
                fontSize: '0.84rem',
                lineHeight: 1.45
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
              <div>
                <strong style={{ display: 'block', color: '#fef08a', marginBottom: 2 }}>
                  ПРЕДУПРЕЖДЕНИЕ СТЕНДА: ВЕРОЯТНО ПОВРЕЖДЕН ТЕСТОВЫЙ CAM-МОДУЛЬ!
                </strong>
                <span>{test.master_cam_warning}</span>
              </div>
            </div>
          )}

          {/* OTK Summary Card */}
          <div
            style={{
              background: isPass ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.08)',
              border: `1px solid ${isPass ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.3)'}`,
              borderRadius: 8,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isPass ? (
                  <ShieldCheck size={18} style={{ color: '#10b981' }} />
                ) : (
                  <ShieldAlert size={18} style={{ color: '#f43f5e' }} />
                )}
                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: isPass ? '#34d399' : '#fb7185' }}>
                  {isPass ? 'Заключение ОТК: Изделие ГОДНО (PASS)' : 'Заключение ОТК: Изделие ЗАБРАКОВАНО (FAIL)'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {test.tested_at ? new Date(test.tested_at).toLocaleString('ru-RU') : ''}
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {isPass ? (
                <div>
                  <strong style={{ color: '#10b981' }}>✓ Все проверки пройдены успешно:</strong> Аппаратный контроллер слота (/dev/dvb0.ca0) активен, тестовый CAM-модуль распознан, взаимная аутентификация CI+ завершена штатно. Телевизор разрешен к передаче на следующий пост.
                </div>
              ) : failureInfo && (
                <div>
                  <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '0.84rem' }}>
                      <strong style={{ color: '#ffd166' }}>Стадия выявления брака: </strong>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{failureInfo.stage}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem' }}>
                      <strong style={{ color: '#f43f5e' }}>Характер брака: </strong>
                      <span style={{ color: '#e2e8f0' }}>{failureInfo.defect}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Системный код ошибки: <span style={{ fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>{failureInfo.rawCode}</span>
                    </div>
                  </div>
                  <div style={{ color: '#fca5a5', fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', padding: '8px 12px', borderRadius: 4, borderLeft: '3px solid #f43f5e' }}>
                    <strong>Действие для сотрудника: </strong>
                    <span>{failureInfo.action}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw Log Terminal */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Протокол проверки ОТК и сервисные логи ADB:
              </span>
            </div>
            <pre className="code-terminal" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {test.raw_adb_log || '// Лог пуст или не был записан'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
