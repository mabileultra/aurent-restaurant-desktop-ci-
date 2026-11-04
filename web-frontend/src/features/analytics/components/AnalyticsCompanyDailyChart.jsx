import React, { useMemo } from 'react';
import { fmtDayFull, fmtDayShort, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyDailyChart({
  days = [],
  selectedDay = '2026-10-24',
  onSelectDay,
}) {
  const chartData = useMemo(() => {
    if (days.length > 0) {
      return days.map((d) => ({
        date: d.date,
        label: fmtDayShort(d.date),
        fullDate: fmtDayFull(d.date),
        fiscal: Number(d.fiscalTurnover || 0),
        nonFiscal: Number(d.nonFiscalTurnover || 0),
        total: Number(d.totalTurnover || 0),
      }));
    }

    // Default realistic mock for Farina Invest (PDF page 5)
    return [
      { date: '2026-10-06', label: '6-okt', fullDate: '6-okt, 2026', fiscal: 0, nonFiscal: 0, total: 0 },
      { date: '2026-10-13', label: '13-okt', fullDate: '13-okt, 2026', fiscal: 0, nonFiscal: 0, total: 0 },
      { date: '2026-10-20', label: '20-okt', fullDate: '20-okt, 2026', fiscal: 0, nonFiscal: 0, total: 0 },
      { date: '2026-10-23', label: '23-okt', fullDate: '23-okt, 2026', fiscal: 0, nonFiscal: 49400000, total: 49400000 },
      { date: '2026-10-24', label: '24-okt', fullDate: '24-oktabr, shanba', fiscal: 1190000000, nonFiscal: 0, total: 1190000000 },
      { date: '2026-10-27', label: '27-okt', fullDate: '27-okt, 2026', fiscal: 380000000, nonFiscal: 0, total: 380000000 },
      { date: '2026-10-31', label: '31-okt', fullDate: '31-okt, 2026', fiscal: 420000000, nonFiscal: 0, total: 420000000 },
      { date: '2026-11-03', label: '3-noy', fullDate: '3-noy, 2026', fiscal: 100500000, nonFiscal: 0, total: 100500000 },
    ];
  }, [days]);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.total), 1);
    return max * 1.15;
  }, [chartData]);

  return (
    <div className="an-card" aria-label="Kunlar bo‘yicha aylanma">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Kunlar bo‘yicha aylanma</h3>
          <p className="an-card-sub">Ustunni tanlang — o‘sha kungi cheklar o‘ngda ochiladi</p>
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

      <div className="an-chart-container">
        <div className="an-chart-bars" style={{ height: 170 }}>
          {chartData.map((item) => {
            const isSelected = selectedDay === item.date;
            const fiscalHeight = (item.fiscal / maxVal) * 100;
            const nonFiscalHeight = (item.nonFiscal / maxVal) * 100;

            return (
              <div
                key={item.date}
                className="an-chart-col"
                onClick={() => onSelectDay && onSelectDay(item.date)}
                title={`${item.fullDate}: ${fmtMoney(item.total)}`}
              >
                {isSelected && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', marginBottom: '0.2rem' }}>
                    1,19 mlrd
                  </span>
                )}
                <div
                  className="an-chart-bar-stack"
                  style={{
                    border: isSelected ? '2px solid #047857' : 'none',
                    transform: isSelected ? 'scale(1.05)' : 'none',
                  }}
                >
                  <div className="an-chart-bar-fiscal" style={{ height: `${fiscalHeight}%` }} />
                  <div className="an-chart-bar-nonfiscal" style={{ height: `${nonFiscalHeight}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="an-chart-date-labels">
          {chartData.map((item) => (
            <span
              key={item.date}
              style={{
                fontWeight: selectedDay === item.date ? 700 : 400,
                color: selectedDay === item.date ? '#047857' : '#94a3b8',
              }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="an-chart-metrics">
        <div>
          <div className="an-metric-block-label">Eng yuqori kun</div>
          <div className="an-metric-block-val">24-okt · 1,19 mlrd</div>
        </div>
        <div>
          <div className="an-metric-block-label">O‘tgan hafta</div>
          <div className="an-metric-block-val">
            652,1 mln <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>↓ 49,4%</span>
          </div>
        </div>
        <div>
          <div className="an-metric-block-label">Joriy hafta · 3 kun</div>
          <div className="an-metric-block-val">100,5 mln</div>
        </div>
      </div>
    </div>
  );
}
