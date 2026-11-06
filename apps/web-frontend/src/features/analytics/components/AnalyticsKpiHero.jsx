import React from 'react';
import { fmtDeltaBadge, fmtMoney, fmtNum, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsKpiHero({
  kpi,
  totals,
  loading = false,
}) {
  const hasKpi = Boolean(kpi);
  const totalEnterprises = Number(kpi?.totalEnterprises || 0);
  const connected = Number(kpi?.connected || 0);
  const notConnected = Number(kpi?.notConnected || 0);
  const totalTurnover = Number(kpi?.totalTurnover ?? totals?.totalTurnover ?? 0);
  const fiscalTurnover = Number(totals?.fiscalTurnover || 0);
  const nonFiscalTurnover = Number(totals?.nonFiscalTurnover || 0);
  const newConnections = Number(kpi?.newConnections || 0);

  const connectedPct = kpi?.connectedSharePct != null
    ? fmtPercent(kpi.connectedSharePct)
    : (totalEnterprises > 0 ? fmtPercent((connected / totalEnterprises) * 100) : '0,0%');

  const notConnectedPct = kpi?.notConnectedSharePct != null
    ? fmtPercent(kpi.notConnectedSharePct)
    : (totalEnterprises > 0 ? fmtPercent((notConnected / totalEnterprises) * 100) : '0,0%');

  const fiscalPct = totals?.fiscalPct != null
    ? fmtPercent(totals.fiscalPct)
    : (totalTurnover > 0 ? fmtPercent((fiscalTurnover / totalTurnover) * 100) : '0,0%');

  const nonFiscalPct = totals?.nonFiscalPct != null
    ? fmtPercent(totals.nonFiscalPct)
    : (totalTurnover > 0 ? fmtPercent((nonFiscalTurnover / totalTurnover) * 100) : '0,0%');

  const turnoverDelta = fmtDeltaBadge(kpi?.totalTurnoverDeltaPct);
  const newConnDelta = fmtDeltaBadge(kpi?.newConnectionsDeltaPct);

  return (
    <section className="an-7kpi-grid" aria-label="Asosiy ko‘rsatkichlar">
      {/* 1. Jami korxonalar */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start' }}>Jami korxonalar</span>
        <span className="v">{loading ? '…' : !hasKpi ? '—' : fmtNum(totalEnterprises)}</span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>
          {hasKpi ? `${connectedPct} ulanish darajasi` : 'Ma‘lumot yo‘q'}
        </span>
      </div>

      {/* 2. Fiskal tizimga ulangan */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start' }}>Fiskal tizimga ulangan</span>
        <span className="v">
          {loading ? '…' : !hasKpi ? '—' : (
            <>
              {fmtNum(connected)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{connectedPct}</span>
            </>
          )}
        </span>
        <span role="img" aria-label={`Ulanish darajasi ${connectedPct}`} style={{ height: 5, borderRadius: 9, background: '#E3EBFD', display: 'flex' }}>
          <span style={{ width: `${Math.min(100, (connected / (totalEnterprises || 1)) * 100)}%`, background: '#2563EB', borderRadius: 9 }} />
        </span>
      </div>

      {/* 3. Ulanmagan */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start' }}>Ulanmagan</span>
        <span className="v">
          {loading ? '…' : !hasKpi ? '—' : (
            <>
              {fmtNum(notConnected)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{notConnectedPct}</span>
            </>
          )}
        </span>
        <span style={{ fontSize: '12px', color: !hasKpi ? '#6B7280' : notConnected > 0 ? '#B42318' : '#16A34A' }}>
          {!hasKpi ? '—' : notConnected > 0 ? 'Fiskal modul yo‘q' : 'Barchasi ulangan'}
        </span>
      </div>

      {/* 4. Umumiy aylanma */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', borderColor: '#C9DAFB' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start' }}>Umumiy aylanma</span>
        <span className="v">{loading ? '…' : !hasKpi && totalTurnover === 0 ? '—' : fmtMoney(totalTurnover, { showCurrency: false })}</span>
        <span style={{ fontSize: '12px' }}>
          <span className={turnoverDelta.dir}>{turnoverDelta.text}</span>
        </span>
      </div>

      {/* 5. Fiskal aylanma */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2563EB', marginTop: 4 }} />
          Fiskal aylanma
        </span>
        <span className="v">{loading ? '…' : !hasKpi && fiscalTurnover === 0 ? '—' : fmtMoney(fiscalTurnover, { showCurrency: false })}</span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>{hasKpi && totalTurnover > 0 ? `${fiscalPct} ulush` : '—'}</span>
      </div>

      {/* 6. Nofiskal aylanma */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EA7A2B', marginTop: 4 }} />
          Nofiskal aylanma
        </span>
        <span className="v">{loading ? '…' : !hasKpi && nonFiscalTurnover === 0 ? '—' : fmtMoney(nonFiscalTurnover, { showCurrency: false })}</span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>{hasKpi && totalTurnover > 0 ? `${nonFiscalPct} ulush` : '—'}</span>
      </div>

      {/* 7. Yangi ulanishlar */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="k" style={{ minHeight: '30px', display: 'flex', alignItems: 'flex-start' }}>Yangi ulanishlar</span>
        <span className="v">{loading ? '…' : !hasKpi ? '—' : fmtNum(newConnections)}</span>
        <span style={{ fontSize: '12px' }}>
          <span className={newConnDelta.dir}>{newConnDelta.text}</span>
        </span>
      </div>
    </section>
  );
}
