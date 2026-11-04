import React from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

const DEFAULT_TOP10 = [
  { companyId: 1, name: 'Farina Invest', connected: true, total: 2040000000, fiscal: 1990000000, nonFiscal: 50000000 },
  { companyId: 2, name: 'MAKON RBB', connected: true, total: 808900000, fiscal: 808900000, nonFiscal: 0 },
  { companyId: 3, name: 'Aminjon Samarqand XK', connected: true, total: 600700000, fiscal: 595000000, nonFiscal: 5700000 },
  { companyId: 4, name: 'Makon Mobile', connected: true, total: 512400000, fiscal: 508000000, nonFiscal: 4400000 },
  { companyId: 5, name: '“ANNODENT SS” MCHJ', connected: true, total: 147000000, fiscal: 138000000, nonFiscal: 9000000 },
  { companyId: 6, name: 'OOO “OZODA”', connected: true, total: 42500000, fiscal: 42200000, nonFiscal: 300000 },
  { companyId: 7, name: 'MCHJ NARZIKULOV SAM MARKET', connected: true, total: 42200000, fiscal: 39700000, nonFiscal: 2500000 },
  { companyId: 8, name: 'Sharks Avenue', connected: false, total: 37000000, fiscal: 0, nonFiscal: 37000000 },
  { companyId: 9, name: '404 Toys', connected: false, total: 26900000, fiscal: 0, nonFiscal: 26900000 },
  { companyId: 10, name: 'Sam Maftuna Farzona', connected: true, total: 26700000, fiscal: 26700000, nonFiscal: 0 },
];

export default function AnalyticsCompanyTop10Chart({ companies = [], onSelectCompany }) {
  const list = companies.length > 0
    ? companies.slice(0, 10).map((c) => ({
      companyId: c.companyId,
      name: c.name,
      connected: c.connected,
      total: Number(c.totalTurnover || 0),
      fiscal: Number(c.fiscalTurnover || 0),
      nonFiscal: Number(c.nonFiscalTurnover || 0),
    }))
    : DEFAULT_TOP10;

  const maxTotal = Math.max(...list.map((c) => c.total), 1);

  return (
    <div className="an-card" aria-label="Top 10 firma">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Top 10 firma — umumiy aylanma</h3>
          <p className="an-card-sub">30 kun, so‘m · fiskal va fiskalsiz qismlar</p>
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
        {list.map((c) => {
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
                <div style={{ width: `${fiscalWidth}%`, background: '#059669', height: '100%' }} />
                <div style={{ width: `${nonFiscalWidth}%`, background: '#f59e0b', height: '100%' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
