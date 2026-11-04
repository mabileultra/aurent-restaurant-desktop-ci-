import React, { useMemo } from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

const DEFAULT_WEEKS = [
  { label: '14 sen', amount: 0 },
  { label: '21 sen', amount: 0 },
  { label: '28 sen', amount: 0 },
  { label: '5 okt', amount: 0 },
  { label: '12 okt', amount: 0 },
  { label: '19 okt', amount: 1290000000 },
  { label: '26 okt', amount: 652100000 },
  { label: '2 noy', amount: 100500000 },
];

export default function AnalyticsCompanyWeeklyChart({ weeks = [] }) {
  const list = weeks.length > 0
    ? weeks.map((w, idx) => ({
      label: w.label || `H-${idx + 1}`,
      amount: Number(w.totalTurnover || w.amount || 0),
    }))
    : DEFAULT_WEEKS;

  const maxVal = useMemo(() => {
    const m = Math.max(...list.map((w) => w.amount), 1);
    return m * 1.15;
  }, [list]);

  return (
    <div className="an-card" aria-label="Haftalik dinamika">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Haftalik dinamika</h3>
          <p className="an-card-sub">Oxirgi 8 hafta, so‘m</p>
        </div>
      </div>

      <div className="an-chart-container">
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
                    height: `${heightPct}%`,
                    background: '#047857',
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
      </div>

      <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0.75rem 0 0', lineHeight: 1.4 }}>
        14-sentabr – 22-oktabr oralig‘ida savdo bo‘lmagan. Oxirgi hafta 3 kunlik.
      </p>
    </div>
  );
}
