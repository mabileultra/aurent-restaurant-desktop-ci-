import React from 'react';
import { ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsCompaniesTable({
  rows = [],
  total = 114,
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

  return (
    <div className="an-card" aria-label="Firmalar ro‘yxati">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Firmalar ro‘yxati <span style={{ color: '#64748b', fontWeight: 500 }}>{total} ta</span></h3>
          <p className="an-card-sub">Haftalar dushanbadan yakshanbagacha to‘liq taqqoslanadi; joriy hafta alohida ustunda.</p>
        </div>

        {onExport ? (
          <button type="button" className="an-export-btn" onClick={onExport}>
            <Download size={14} aria-hidden />
            <span>Excel</span>
          </button>
        ) : null}
      </div>

      <div className="an-table-wrap">
        <table className="an-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Firma</th>
              <th>Hudud</th>
              <th>Fiskal holat</th>
              <th>Umumiy aylanma</th>
              <th>Fiskal ulush</th>
              <th>19–25 okt</th>
              <th>26 okt – 1 noy</th>
              <th>Haftalik o‘zgarish</th>
              <th>Joriy hafta · 3 kun</th>
              <th aria-label="Amal" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8' }}>Yuklanmoqda…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8' }}>Firmalar topilmadi</td></tr>
            ) : rows.map((r, index) => {
              const rowNum = page * size + index + 1;
              const totalTurnover = Number(r.totalTurnover || 0);
              const fiscalTurnover = Number(r.fiscalTurnover || 0);
              const fiscalShare = totalTurnover > 0 ? (fiscalTurnover / totalTurnover) * 100 : (r.connected ? 100 : 0);
              const weekChange = r.weekDeltaPct != null ? Number(r.weekDeltaPct) : null;
              const isNew = r.prevWeekTurnover === 0 && r.weekTurnover > 0;

              return (
                <tr
                  key={r.companyId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(r.companyId)}
                >
                  <td style={{ color: '#94a3b8' }}>{rowNum}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>STIR {r.tin || 'kiritilmagan'}</div>
                  </td>
                  <td>
                    {r.regionNameRu || r.regionNameUz ? (
                      <span>{r.regionNameUz || r.regionNameRu}</span>
                    ) : (
                      <span style={{ color: '#d97706' }}>Ko‘rsatilmagan</span>
                    )}
                  </td>
                  <td>
                    <span className={`an-badge ${r.connected ? 'an-badge--green' : 'an-badge--red'}`}>
                      ● {r.connected ? 'Ulangan' : 'Ulanmagan'}
                    </span>
                  </td>
                  <td>
                    <strong>{fmtMoney(totalTurnover)}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${fiscalShare}%`, height: '100%', background: '#059669' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>{fiscalShare.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{r.prevWeekTurnover ? fmtMoney(r.prevWeekTurnover) : '0'}</td>
                  <td>{r.weekTurnover ? fmtMoney(r.weekTurnover) : '0'}</td>
                  <td>
                    {isNew ? (
                      <span className="an-badge an-badge--amber">Yangi</span>
                    ) : weekChange != null ? (
                      <span style={{ color: weekChange >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                        {weekChange >= 0 ? '↑' : '↓'} {fmtPercent(Math.abs(weekChange))}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{fmtMoney(r.currentWeekTurnover || 0)}</td>
                  <td><ChevronRight size={16} color="#94a3b8" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        marginTop: '0.85rem',
        fontSize: '0.8rem',
        color: '#64748b',
      }}>
        <div>Ko‘rsatilmoqda {page * size + 1}–{Math.min((page + 1) * size, total)} / {total}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {[10, 20, 50, 100].map((sz) => (
            <button
              key={sz}
              type="button"
              className={`an-period-btn${size === sz ? ' is-active' : ''}`}
              style={{ padding: '0.2rem 0.5rem' }}
              onClick={() => setSize(sz)}
            >
              {sz}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 4, padding: '0.2rem 0.5rem', cursor: 'pointer' }}
            >
              ‹
            </button>
            <span>{page + 1} / {maxPages}</span>
            <button
              type="button"
              disabled={page >= maxPages - 1}
              onClick={() => setPage(page + 1)}
              style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 4, padding: '0.2rem 0.5rem', cursor: 'pointer' }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
