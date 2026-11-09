import React from 'react';
import { useTestStore } from '../store/useTestStore';
import { Search, FileText, CheckCircle2, XCircle, Clock, Wifi } from 'lucide-react';
import { translateFailureReason } from '../utils/failureTranslation';

export const RecentTestsTable: React.FC = () => {
  const {
    recentTests,
    recentFilter,
    setRecentFilter,
    recentSearch,
    setRecentSearch,
    setSelectedTestForLog
  } = useTestStore();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' +
             d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <Clock size={20} style={{ color: '#00f2fe' }} />
          <span>История Проверок CI/CI+ (База данных SQLite WAL)</span>
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Записей: {recentTests.length}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Поиск по S/N, IP адресу или модели..."
            value={recentSearch}
            onChange={(e) => setRecentSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`pill-btn ${recentFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRecentFilter('ALL')}
          >
            Все ({recentTests.length})
          </button>
          <button
            className={`pill-btn ${recentFilter === 'PASS' ? 'active' : ''}`}
            onClick={() => setRecentFilter('PASS')}
          >
            Только PASS
          </button>
          <button
            className={`pill-btn ${recentFilter === 'FAIL' ? 'active' : ''}`}
            onClick={() => setRecentFilter('FAIL')}
          >
            Только FAIL
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="qc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>IP Адрес</th>
              <th>Серийный номер (S/N)</th>
              <th>Модель (Model Number)</th>
              <th>Аппаратный DVB / ca0</th>
              <th>CI+ Аутентификация</th>
              <th>CAM Модуль</th>
              <th>Итог проверки</th>
              <th>Время</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {recentTests.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  История проверок пуста. Подключите ТВ по IP, введите серийный номер и запустите тест.
                </td>
              </tr>
            ) : (
              recentTests.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>#{t.id}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Wifi size={13} style={{ color: '#00f2fe' }} />
                      {t.ip_address || '-'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#00f2fe', letterSpacing: '0.02em' }}>
                      {t.serial_number}
                    </strong>
                  </td>
                  <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{t.model_name || '-'}</td>
                  <td>
                    {t.hardware_detected ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <CheckCircle2 size={14} /> /dev/ca0 OK
                      </span>
                    ) : (
                      <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <XCircle size={14} /> Нет узла ca0
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        color: t.auth_status === 'SUCCESS' ? '#10b981' : t.auth_status === 'TIMEOUT' ? '#f59e0b' : '#f43f5e',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      {t.auth_status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {t.cam_model_name || 'Не опознан'}
                  </td>
                  <td>
                    {t.test_result === 'PASS' ? (
                      <span className="table-badge pass">
                        <CheckCircle2 size={12} /> PASS
                      </span>
                    ) : (
                      <span 
                        className="table-badge fail" 
                        title={`${translateFailureReason(t.failure_reason).stage}\n${translateFailureReason(t.failure_reason).defect}`}
                        style={{ cursor: 'help' }}
                      >
                        <XCircle size={12} /> FAIL
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDate(t.tested_at)}
                  </td>
                  <td>
                    <button
                      className="btn-icon-action"
                      onClick={() => setSelectedTestForLog(t)}
                      title="Просмотреть сырой лог ADB (dmesg & logcat)"
                    >
                      <FileText size={13} />
                      <span>Лог</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
