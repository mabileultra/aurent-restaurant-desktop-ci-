import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtDeltaBadge, fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsTopRegionsCard({
  regions = [],
  totalTurnover = 0,
  periodLabel = '30 kun',
}) {
  const list = Array.isArray(regions) ? regions.slice(0, 5) : [];
  const maxTurnover = list.length > 0 ? Math.max(...list.map((r) => Number(r.totalTurnover || 0)), 1) : 1;
  const totalAllTurnover = totalTurnover > 0 ? totalTurnover : list.reduce((sum, r) => sum + Number(r.totalTurnover || 0), 0);

  return (
    <section
      className="card"
      aria-labelledby="topr"
      style={{
        flex: '2 1 380px',
        minWidth: 0,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 id="topr" className="t">Aylanma bo‘yicha TOP hududlar</h2>
          <p className="s">Bosilsa hududlar sahifasi ochiladi</p>
        </div>
        <Link to="/platform/analytics/regions" className="btn">
          <span>Hududlar</span>
          <ChevronRight className="ic" />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            Hududlar bo‘yicha ma‘lumot mavjud emas
          </div>
        ) : (
          list.map((r, idx) => {
            const amount = Number(r.totalTurnover || 0);
            const delta = fmtDeltaBadge(r.turnoverDeltaPct);
            const widthPct = Math.max(2, (amount / maxTurnover) * 100);
            const sharePct = totalAllTurnover > 0 ? fmtPercent((amount / totalAllTurnover) * 100) : '0,0%';

            return (
              <Link
                key={r.code || idx}
                to="/platform/analytics/regions"
                style={{ textDecoration: 'none', color: '#1F2937', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>
                    <b style={{ color: '#6B7280', marginRight: '8px' }}>{idx + 1}</b>
                    {r.nameUz || r.nameRu || 'Hududi ko‘rsatilmagan'}
                  </span>
                  <b>{fmtMoney(amount, { showCurrency: false })}</b>
                </div>

                <div style={{ height: 10, borderRadius: '0 4px 4px 0', display: 'flex', background: '#F1F5F9' }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      background: idx === 0 ? '#2563EB' : '#93C5FD',
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
                  <span>
                    {r.enterprises || 0} korxona · {r.connected || 0} ulangan
                  </span>
                  <span>
                    {sharePct} ulush · <span className={delta.dir}>{delta.text}</span>
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <p style={{ margin: 'auto 0 0', fontSize: '12px', color: '#6B7280', background: '#F9FAFB', borderRadius: 9, padding: '9px 11px' }}>
        Barcha hududlar kesimidagi tafsilotlar «Hududlar» bo‘limida
      </p>
    </section>
  );
}
