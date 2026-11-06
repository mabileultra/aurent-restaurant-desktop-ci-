import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmtMoney, sanitizeText } from '../utils/analyticsFormat';

export default function AnalyticsRegionCompaniesMiniTable({ companies = [] }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(companies.length / pageSize) || 1;

  // Reset page when companies list changes (e.g. district filter)
  React.useEffect(() => {
    setPage(1);
  }, [companies]);

  const displayedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return companies.slice(start, start + pageSize);
  }, [companies, page]);

  return (
    <div style={{ flex: '2 1 420px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="k">Korxonalar ro‘yxati ({companies.length})</span>
        <button
          type="button"
          className="btn"
          style={{ height: '28px', fontSize: '12px' }}
          onClick={() => navigate('/platform/analytics/companies')}
        >
          Barcha korxonalar <ChevronRight size={13} />
        </button>
      </div>

      <div className="an-table-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
        <table className="an-table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>STIR</th>
              <th>Aylanma</th>
              <th>Fiskal</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  Ushbu tumanda korxonalar topilmadi
                </td>
              </tr>
            ) : (
              displayedRows.map((c) => (
                <tr
                  key={c.companyId || c.tin}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/platform/analytics/companies/${c.companyId}`)}
                >
                  <td style={{ fontWeight: 600 }}>{sanitizeText(c.name)}</td>
                  <td style={{ color: '#6B7280' }}>{c.tin || '—'}</td>
                  <td><strong>{fmtMoney(c.totalTurnover)}</strong></td>
                  <td>
                    <span className={`badge ${c.connected ? 'ok' : 'no'}`}>
                      {c.connected ? 'Ulangan' : 'Ulanmagan'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, companies.length)} / {companies.length}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ padding: '2px 6px', height: '26px' }}
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: '4px 8px', fontWeight: 600 }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '2px 6px', height: '26px' }}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
