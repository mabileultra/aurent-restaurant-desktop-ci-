import React, { useMemo } from 'react';
import { fmtMoney, fmtPercentText, sanitizeText } from '../utils/analyticsFormat';

export default function AnalyticsCompanyDetailKpis({
  detail,
  periodLabel = '30 kun',
}) {
  const total = Number(detail?.totalTurnover || 0);
  const fiscal = Number(detail?.fiscalTurnover || 0);
  const nonFiscal = Number(detail?.nonFiscalTurnover || 0);
  const fiscalSharePct = total > 0 ? (fiscal / total) * 100 : 0;

  const days = Array.isArray(detail?.days) ? detail.days : [];
  const activeDaysCount = useMemo(() => days.filter((d) => Number(d.totalTurnover || 0) > 0).length, [days]);
  const avgTurnoverOnActiveDays = activeDaysCount > 0 ? total / activeDaysCount : 0;

  const regionName = sanitizeText(detail?.regionNameUz || detail?.regionNameRu || '');

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
            {regionName ? `${regionName} · ${days.length} kunlik tahlil` : `${days.length} kunlik tahlil`}
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
          <p className="an-sub-kpi-meta">Jami aylanmaning {fmtPercentText(fiscalSharePct)}</p>
        </div>

        <div className="an-sub-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <span className="an-legend-dot an-legend-dot--nonfiscal" />
            <p className="an-sub-kpi-label">Nofiskal aylanma</p>
          </div>
          <div className="an-sub-kpi-val">{fmtMoney(nonFiscal)}</div>
          <p className="an-sub-kpi-meta">
            {nonFiscal > 0 ? 'Fiskallashtirilmagan qism' : 'Barcha savdolar fiskal'}
          </p>
        </div>

        <div className="an-sub-kpi-card">
          <p className="an-sub-kpi-label">Savdo kunlari</p>
          <div className="an-sub-kpi-val">{activeDaysCount} / {days.length || 30}</div>
          <p className="an-sub-kpi-meta">
            {activeDaysCount > 0 ? `Savdo kunida o‘rtacha ${fmtMoney(avgTurnoverOnActiveDays, { showCurrency: false })}` : 'Savdo yo‘q'}
          </p>
        </div>
      </div>
    </section>
  );
}
