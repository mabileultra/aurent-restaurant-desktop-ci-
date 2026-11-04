import React from 'react';
import { Link } from 'react-router-dom';
import { fmtMoney } from '../utils/analyticsFormat';

const TOP10 = [
  { rank: 1, name: 'Farina Invest', amount: 2040000000, share: 46.4, fiscal: 1990000000, nonFiscal: 50000000 },
  { rank: 2, name: 'MAKON RBB', amount: 808900000, share: 18.4, fiscal: 808900000, nonFiscal: 0 },
  { rank: 3, name: 'Aminjon Samarqand XK', amount: 600700000, share: 13.7, fiscal: 595000000, nonFiscal: 5700000 },
  { rank: 4, name: 'Makon Mobile', amount: 512400000, share: 11.7, fiscal: 508000000, nonFiscal: 4400000 },
  { rank: 5, name: '“ANNODENT SS” MCHJ', amount: 147000000, share: 3.3, fiscal: 138000000, nonFiscal: 9000000 },
  { rank: 6, name: 'OOO “OZODA”', amount: 42500000, share: 1.0, fiscal: 42200000, nonFiscal: 300000 },
  { rank: 7, name: 'MCHJ NARZIKULOV SAM MARKET', amount: 42200000, share: 1.0, fiscal: 39700000, nonFiscal: 2500000 },
  { rank: 8, name: 'Sharks Avenue', amount: 37000000, share: 0.8, fiscal: 0, nonFiscal: 37000000, notConnected: true },
  { rank: 9, name: '404 Toys', amount: 26900000, share: 0.6, fiscal: 0, nonFiscal: 26900000, notConnected: true },
  { rank: 10, name: 'Sam Maftuna Farzona', amount: 26700000, share: 0.6, fiscal: 26700000, nonFiscal: 0 },
];

export default function AnalyticsTopCompaniesCard() {
  const maxAmount = TOP10[0].amount;

  return (
    <div className="an-card" aria-label="TOP-10 korxona">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Aylanma bo‘yicha TOP-10 korxona</h3>
          <p className="an-card-sub">30 kun · bosilsa korxona detalizatsiyasi ochiladi</p>
        </div>

        <Link
          to="/platform/analytics/companies"
          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
        >
          Barchasi ›
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {TOP10.map((c) => {
          const widthPct = (c.amount / maxAmount) * 100;
          const fiscalWidthPct = c.fiscal > 0 ? (c.fiscal / c.amount) * 100 : 0;
          return (
            <div key={c.rank} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ width: '1.2rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
                {c.rank}
              </span>
              <div style={{ width: '11rem', minWidth: '10rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
                {c.notConnected && (
                  <span className="an-badge an-badge--red" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                    Ulanmagan
                  </span>
                )}
              </div>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${widthPct}%`, display: 'flex', height: '100%' }}>
                  <div style={{ width: `${fiscalWidthPct}%`, background: '#2563eb', height: '100%' }} />
                  <div style={{ width: `${100 - fiscalWidthPct}%`, background: '#f59e0b', height: '100%' }} />
                </div>
              </div>
              <span style={{ width: '4.8rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                {fmtMoney(c.amount, { showCurrency: false })}
              </span>
              <span style={{ width: '2.8rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                {c.share}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
