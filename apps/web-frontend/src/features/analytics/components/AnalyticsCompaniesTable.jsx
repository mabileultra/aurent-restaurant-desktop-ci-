import React from 'react';
import { ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fmtMoney, fmtPercent, sanitizeText } from '../utils/analyticsFormat';
import { exportToCsv } from '../utils/analyticsExport';

export default function AnalyticsCompaniesTable({
  rows = [],
  total = 0,
  page = 0,
  size = 10,
  setPage,
  setSize,
  loading = false,
  onExport,
}) {
  const navigate = useNavigate();
  const maxPages = Math.ceil(total / size) || 1;

  const handleRowClick = (companyId) => {
    navigate(`/platform/analytics/companies/${companyId}`);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['#', 'Firma', 'STIR', 'Hudud', 'Fiskal holat', 'Umumiy aylanma', 'Fiskal ulush'];
    const data = rows.map((r, index) => {
      const totalTurnover = Number(r.totalTurnover || 0);
      const fiscalTurnover = Number(r.fiscalTurnover || 0);
      const fiscalShare = totalTurnover > 0 ? (fiscalTurnover / totalTurnover) * 100 : (r.connected ? 100 : 0);
      return [
        page * size + index + 1,
        r.name,
        r.tin || '',
        r.regionNameUz || r.regionNameRu || 'Ko‘rsatilmagan',
        r.connected ? 'Ulangan' : 'Ulanmagan',
        fmtMoney(totalTurnover),
        fmtPercent(fiscalShare),
      ];
    });
    exportToCsv('kompaniyalar-analitika', headers, data);
  };

  return (
    <div className="an-card" aria-label="Firmalar ro‘yxati">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Firmalar ro‘yxati <span style={{ color: '#64748b', fontWeight: 500 }}>{total} ta</span></h3>
          <p className="an-card-sub">Aylanma bo‘yicha tartiblangan · bosilsa korxona detalizatsiyasi ochiladi</p>
        </div>

        <button type="button" className="an-export-btn" onClick={handleExport}>
          <Download size={14} aria-hidden />
          <span>Excel / CSV</span>
        </button>
      </div>

      <div className="an-table-wrap an-companies-table-wrap">
        <table className="an-table an-companies-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Firma</th>
              <th>Hudud</th>
              <th>Fiskal holat</th>
              <th>Umumiy aylanma</th>
              <th>Fiskal ulush</th>
              <th>Oldingi hafta</th>
              <th>Haftalik aylanma</th>
              <th>Haftalik o‘zgarish</th>
              <th aria-label="Amal" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>Yuklanmoqda…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>Firmalar topilmadi</td></tr>
            ) : rows.map((r, index) => {
              const rowNum = page * size + index + 1;
              const totalTurnover = Number(r.totalTurnover || 0);
              const fiscalTurnover = Number(r.fiscalTurnover || 0);
              const fiscalShare = totalTurnover > 0 ? (fiscalTurnover / totalTurnover) * 100 : (r.connected ? 100 : 0);
              const weekChange = r.weekDeltaPct != null ? Number(r.weekDeltaPct) : null;
              const isNew = r.prevWeekTurnover === 0 && r.weekTurnover > 0;

              return (
                <tr
                  key={r.companyId || r.tin || index}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(r.companyId)}
                >
                  <td style={{ color: '#94a3b8' }}>{rowNum}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{sanitizeText(r.name)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>STIR {r.tin || 'kiritilmagan'}</div>
                  </td>
                  <td>
                    {r.regionNameRu || r.regionNameUz ? (
                      <span>{sanitizeText(r.regionNameUz || r.regionNameRu)}</span>
                    ) : (
                      <span style={{ color: '#d97706' }}>Ko‘rsatilmagan</span>
                    )}
                  </td>
                  <td>
                    <span className={`an-badge ${r.connected ? 'an-badge--blue' : 'an-badge--red'}`}>
                      ● {r.connected ? 'Ulangan' : 'Ulanmagan'}
                    </span>
                  </td>
                  <td>
                    <strong>{fmtMoney(totalTurnover)}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${fiscalShare}%`, height: '100%', background: '#2563EB' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>{fmtPercent(fiscalShare)}</span>
                    </div>
                  </td>
                  <td>{fmtMoney(r.prevWeekTurnover || 0)}</td>
                  <td>{fmtMoney(r.weekTurnover || 0)}</td>
                  <td>
                    {isNew ? (
                      <span className="an-badge an-badge--amber">Yangi</span>
                    ) : weekChange != null ? (
                      <span style={{ color: weekChange >= 0 ? '#2563EB' : '#DC2626', fontWeight: 600 }}>
                        {weekChange >= 0 ? '↑' : '↓'} {fmtPercent(Math.abs(weekChange))}
                      </span>
                    ) : '—'}
                  </td>
                  <td><ChevronRight size={16} color="#94a3b8" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {maxPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.8rem',
        }}>
          <span style={{ color: '#64748b' }}>
            Sahifa {page + 1} / {maxPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="an-btn an-btn--outline"
              disabled={page <= 0}
              onClick={() => setPage && setPage((p) => Math.max(0, p - 1))}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
            >
              Oldingi
            </button>
            <button
              type="button"
              className="an-btn an-btn--outline"
              disabled={page >= maxPages - 1}
              onClick={() => setPage && setPage((p) => Math.min(maxPages - 1, p + 1))}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
