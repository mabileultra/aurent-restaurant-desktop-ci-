import React from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyDetailKpis({
  detail,
  periodLabel = '30 kun',
}) {
  const total = Number(detail?.totalTurnover || 2040000000);
  const fiscal = Number(detail?.fiscalTurnover || 1990000000);
  const nonFiscal = Number(detail?.nonFiscalTurnover || 49400000);
  const fiscalShare = total > 0 ? ((fiscal / total) * 100).toFixed(1) : '97.6';

  return (
    <section className="an-kpi-hero-grid" style={{ marginBottom: '1.25rem' }} aria-label="Firma aylanma ko‘rsatkichlari">
      {/* Hero Left Card */}
      <div className="an-hero-kpi-card">
        <div>
          <div className="an-hero-kpi-top">
            <h2 className="an-hero-kpi-title">Umumiy aylanma · {periodLabel}</h2>
          </div>
          <div className="an-hero-kpi-value">{fmtMoney(total)}</div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Samarqand viloyati aylanmasining 48,7% i · birinchi chek 23-oktabrda
          </p>
        </div>
      </div>

      {/* 3 Metrics Right Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        <div className="an-sub-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <span className="an-legend-dot an-legend-dot--fiscal" />
            <p className="an-sub-kpi-label">Fiskal aylanma</p>
          </div>
          <div className="an-sub-kpi-val">{fmtMoney(fiscal)}</div>
          <p className="an-sub-kpi-meta">Jami aylanmaning {fiscalShare}% i</p>
        </div>

        <div className="an-sub-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <span className="an-legend-dot an-legend-dot--nonfiscal" />
            <p className="an-sub-kpi-label">Fiskalsiz aylanma</p>
          </div>
          <div className="an-sub-kpi-val">{fmtMoney(nonFiscal)}</div>
          <p className="an-sub-kpi-meta">Bitta kunda: 23-oktabr</p>
        </div>

        <div className="an-sub-kpi-card">
          <p className="an-sub-kpi-label">Savdo kunlari</p>
          <div className="an-sub-kpi-val">5 / 30</div>
          <p className="an-sub-kpi-meta">Savdo kunida o‘rtacha 408,1 mln</p>
        </div>
      </div>
    </section>
  );
}
