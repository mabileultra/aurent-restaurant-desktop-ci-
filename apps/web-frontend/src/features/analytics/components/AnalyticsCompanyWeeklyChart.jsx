import React, { useMemo } from 'react';
import { fmtDayShort, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyWeeklyChart({ weeks = [] }) {
  const list = useMemo(() => {
    if (!Array.isArray(weeks) || weeks.length === 0) return [];
    return weeks.map((w, idx) => {
      const label = w.label
        || (w.weekFrom && w.weekTo ? `${fmtDayShort(w.weekFrom)}–${fmtDayShort(w.weekTo)}` : (w.from ? `${w.from.slice(5)}` : `Hafta ${idx + 1}`));
      return {
        label,
        amount: Number(w.totalTurnover || w.amount || 0),
      };
    });
  }, [weeks]);

  const maxVal = useMemo(() => {
    if (list.length === 0) return 1000;
    const m = Math.max(...list.map((w) => w.amount), 1);
    return m * 1.15;
  }, [list]);

  const activeWeeks = list.filter((w) => w.amount > 0).length;

  return (
    <div className="an-card" aria-label="Haftalik dinamika">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Haftalik dinamika</h3>
          <p className="an-card-sub">Oxirgi haftalar kesimida aylanma, so‘m</p>
        </div>
      </div>

      <div className="an-chart-container">
        {list.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Haftalik dinamika ma‘lumoti mavjud emas
          </div>
        ) : (
          <>
            <div className="an-chart-bars" style={{ height: 160 }}>
              {list.map((w) => {
                const heightPct = (w.amount / maxVal) * 100;
                return (
                  <div key={w.label} className="an-chart-col" title={`${w.label}: ${fmtMoney(w.amount)}`}>
                    {w.amount > 0 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem' }}>
                        {fmtMoney(w.amount, { showCurrency: false })}
                      </span>
                    )}
                    <div
                      style={{
                        width: 24,
                        height: `${Math.max(4, heightPct)}%`,
                        background: '#2563EB',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="an-chart-date-labels">
              {list.map((w) => (
                <span key={w.label}>{w.label}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0.75rem 0 0', lineHeight: 1.4 }}>
        {list.length > 0 ? `${list.length} haftadan ${activeWeeks} tasida savdo qayd etilgan.` : 'Savdo ma‘lumoti kutilmoqda.'}
      </p>
    </div>
  );
}
