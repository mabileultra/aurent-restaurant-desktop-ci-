import React from 'react';
import { fmtMoney, fmtNum, fmtPercent, fmtPercentText } from '../utils/analyticsFormat';

export default function AnalyticsCompaniesKpi({
  sellingCount = 0,
  totalCount = 0,
  top5Amount = 0,
  totalAmount = 0,
  top5SharePct = 0,
  nonFiscalAmount = 0,
  notConnectedSellingCount = 0,
  notConnectedAmount = 0,
  periodLabel = '30 kun',
}) {
  const noSalesCount = Math.max(0, totalCount - sellingCount);
  const nonFiscalSharePct = totalAmount > 0
    ? ((nonFiscalAmount / totalAmount) * 100)
    : 0;

  return (
    <section className="an-card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem' }} aria-label="Firmalar umumiy ko‘rsatkichlari">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Savdo qilgan firmalar</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
            {fmtNum(sellingCount)} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {fmtNum(totalCount)}</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            {noSalesCount} tasida {periodLabel} ichida chek yo‘q
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Top-5 firma ulushi</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
            {fmtPercent(top5SharePct)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            {fmtMoney(top5Amount)} / {fmtMoney(totalAmount)}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EA7A2B' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Nofiskal aylanma</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
            {fmtMoney(nonFiscalAmount)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            Umumiy aylanmaning {fmtPercentText(nonFiscalSharePct)}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Ulanmagan, lekin savdo qilgan</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
            {fmtNum(notConnectedSellingCount)} ta
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            {fmtMoney(notConnectedAmount)} nofiskal aylanma
          </div>
        </div>
      </div>
    </section>
  );
}
