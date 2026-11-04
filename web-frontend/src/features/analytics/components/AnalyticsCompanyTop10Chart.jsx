import React from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyTop10Chart({ companies = [], onSelectCompany }) {
  const sorted = [...companies].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  const list = sorted.slice(0, 10).map((c) => ({
    companyId: c.companyId,
    name: c.name,
    connected: c.connected,
    total: Number(c.totalTurnover || 0),
    fiscal: Number(c.fiscalTurnover || 0),
    nonFiscal: Number(c.nonFiscalTurnover || 0),
  }));

  const maxTotal = Math.max(...list.map((c) => c.total), 1);

  return (
    <div className="an-card" aria-label="Top 10 firma">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Top 10 firma — umumiy aylanma</h3>
          <p className="an-card-sub">Aylanma bo‘yicha tartiblangan · fiskal va fiskalsiz qismlar</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div className="an-legend-item">
            <span className="an-legend-dot an-legend-dot--fiscal" />
            <span>Fiskal</span>
          </div>
          <div className="an-legend-item">
            <span className="an-legend-dot an-legend-dot--nonfiscal" />
            <span>Fiskalsiz</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {list.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            Ma‘lumot mavjud emas
          </div>
        ) : (
          list.map((c) => {
            const fiscalWidth = (c.fiscal / maxTotal) * 100;
            const nonFiscalWidth = (c.nonFiscal / maxTotal) * 100;
            return (
              <div
                key={c.companyId || c.name}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectCompany && onSelectCompany(c.companyId)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                    {!c.connected && (
                      <span className="an-badge an-badge--red" style={{ fontSize: '0.65rem', padding: '0 0.35rem' }}>
                        Ulanmagan
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: '0.8rem' }}>{fmtMoney(c.total)}</strong>
                </div>

                <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${fiscalWidth}%`, background: '#2563EB', height: '100%' }} />
                  <div style={{ width: `${nonFiscalWidth}%`, background: '#EA7A2B', height: '100%' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
