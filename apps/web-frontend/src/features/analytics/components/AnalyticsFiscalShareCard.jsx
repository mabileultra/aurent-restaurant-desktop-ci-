import React from 'react';
import { fmtDayShort, fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsFiscalShareCard({
  fiscalTurnover = 0,
  nonFiscalTurnover = 0,
  totalTurnover = 0,
  weeks = [],
}) {
  const sum = totalTurnover > 0 ? totalTurnover : (fiscalTurnover + nonFiscalTurnover);
  const hasData = sum > 0;
  const fiscalPct = hasData ? Math.min(100, Math.max(0, (fiscalTurnover / sum) * 100)) : null;
  const nonFiscalPct = hasData ? Math.max(0, 100 - (fiscalPct || 0)) : null;

  const displayWeeks = Array.isArray(weeks) && weeks.length > 0 ? weeks : [];

  return (
    <section
      className="card"
      aria-labelledby="fn"
      style={{
        flex: '1 1 340px',
        minWidth: 0,
        minHeight: '340px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div>
        <h2 id="fn" className="t">Fiskal va nofiskal aylanma</h2>
        <p className="s">Ulush va davr bo‘yicha taqsimot · 8 ta yirik korxona haftalik ko‘rsatkichi</p>
      </div>

      {/* Top split bar */}
      <div
        role="img"
        aria-label={hasData ? `Fiskal ${fmtPercent(fiscalPct)}, nofiskal ${fmtPercent(nonFiscalPct)}` : 'Ma‘lumot yo‘q'}
        style={{ display: 'flex', gap: 2, height: 28 }}
      >
        <span
          style={{
            flex: `${hasData ? (fiscalPct || 0.001) : 1} 1 0`,
            background: hasData ? '#2563EB' : '#E2E8F0',
            borderRadius: hasData && nonFiscalPct > 0 ? '6px 0 0 6px' : '6px',
            color: hasData ? '#fff' : '#94A3B8',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
            minWidth: hasData && fiscalPct > 0 ? 30 : 0,
          }}
        >
          {hasData ? fmtPercent(fiscalPct) : '—'}
        </span>
        {hasData && nonFiscalPct > 0 && (
          <span
            style={{
              flex: `${nonFiscalPct} 1 0`,
              minWidth: 6,
              background: '#EA7A2B',
              borderRadius: fiscalPct > 0 ? '0 6px 6px 0' : '6px',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
        <span>
          <b>{hasData ? fmtMoney(fiscalTurnover, { showCurrency: false }) : '—'}</b> <span style={{ color: '#6B7280' }}>fiskal</span>
        </span>
        <span>
          <b>{hasData ? fmtMoney(nonFiscalTurnover, { showCurrency: false }) : '—'}</b>{' '}
          <span style={{ color: '#6B7280' }}>nofiskal · {hasData ? fmtPercent(nonFiscalPct) : '—'}</span>
        </span>
      </div>

      {/* Weekly breakdown if available */}
      {displayWeeks.length > 0 && (
        <div style={{ borderTop: '1px solid #F0F2F5', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>
            <span>Hafta</span>
            <span>Fiskal ulush</span>
          </div>

          {displayWeeks.map((w, idx) => {
            const sumTurnover = Number(w.totalTurnover || (Number(w.fiscalTurnover || 0) + Number(w.nonFiscalTurnover || 0)));
            const wFiscal = w.fiscalSharePct != null
              ? Number(w.fiscalSharePct)
              : (sumTurnover > 0 ? (Number(w.fiscalTurnover || 0) / sumTurnover) * 100 : Number(w.pct || 0));
            const label = w.label || (w.weekFrom && w.weekTo ? `${fmtDayShort(w.weekFrom)}–${fmtDayShort(w.weekTo)}` : (w.week || `Hafta ${idx + 1}`));

            return (
              <div
                key={label || idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px minmax(0, 1fr) 52px',
                  gap: '10px',
                  alignItems: 'center',
                  fontSize: '12.5px',
                }}
              >
                <span style={{ color: '#4B5563' }}>{label}</span>
                <span role="img" aria-label={`${fmtPercent(wFiscal)} fiskal`} style={{ display: 'flex', gap: 2, height: 10 }}>
                  <span style={{ width: `${Math.min(100, Math.max(0, wFiscal))}%`, background: '#2563EB', borderRadius: '3px 0 0 3px' }} />
                  <span style={{ flex: '1 1 auto', background: '#EA7A2B', borderRadius: '0 3px 3px 0' }} />
                </span>
                <span className="r" style={{ fontWeight: 600 }}>
                  {fmtPercent(wFiscal)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ margin: 'auto 0 0', fontSize: '12px', color: '#4B5563', background: '#F5F8FF', borderRadius: 9, padding: '9px 11px' }}>
        Jami aylanma: {fmtMoney(sum)} · Fiskal ulush: {fmtPercent(fiscalPct)}
      </p>
    </section>
  );
}
