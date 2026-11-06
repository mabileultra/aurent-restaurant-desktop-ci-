import React, { useMemo } from 'react';
import { fmtDayFull, fmtDayShort, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyDailyChart({
  days = [],
  selectedDay = '',
  onSelectDay,
}) {
  const chartData = useMemo(() => {
    if (days.length > 0) {
      const sorted = [...days].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      return sorted.map((d) => ({
        date: d.date,
        label: fmtDayShort(d.date),
        fullDate: fmtDayFull(d.date),
        fiscal: Number(d.fiscalTurnover || 0),
        nonFiscal: Number(d.nonFiscalTurnover || 0),
        total: Number(d.totalTurnover || 0),
      }));
    }
    return [];
  }, [days]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1000;
    const max = Math.max(...chartData.map((d) => d.total), 1);
    return max * 1.15;
  }, [chartData]);

  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.total > (max?.total || 0) ? d : max), chartData[0]);
  }, [chartData]);

  const selectedItem = useMemo(() => {
    return chartData.find((d) => d.date === selectedDay) || chartData[0];
  }, [chartData, selectedDay]);

  const activeDaysCount = useMemo(() => {
    return chartData.filter((d) => d.total > 0).length;
  }, [chartData]);

  const avgDailyTurnover = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((s, d) => s + d.total, 0);
    return sum / chartData.length;
  }, [chartData]);

  const tickIndices = useMemo(() => {
    if (chartData.length <= 7) return chartData.map((_, i) => i);
    const last = chartData.length - 1;
    return [0, Math.round(last * 0.25), Math.round(last * 0.5), Math.round(last * 0.75), last];
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
            <span>Nofiskal</span>
          </div>
        </div>
      </div>

      <div className="an-chart-container">
        {chartData.length === 0 ? (
          <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Kunlik aylanma ma‘lumoti mavjud emas
          </div>
        ) : (
          <div style={{ minWidth: chartData.length > 14 ? '480px' : '100%' }}>
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
                    {isSelected && item.total > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.2rem', whiteSpace: 'nowrap' }}>
                        {fmtMoney(item.total, { showCurrency: false })}
                      </span>
                    )}
                    <div
                      className="an-chart-bar-stack"
                      style={{
                        outline: isSelected ? '2px solid #2563EB' : 'none',
                        outlineOffset: '1px',
                      }}
                    >
                      <div className="an-chart-bar-fiscal" style={{ height: `${fiscalHeight}%` }} />
                      <div className="an-chart-bar-nonfiscal" style={{ height: `${nonFiscalHeight}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="an-chart-date-labels" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
              {tickIndices.map((idx) => {
                const item = chartData[idx];
                if (!item) return null;
                return (
                  <span
                    key={item.date}
                    style={{
                      fontWeight: selectedDay === item.date ? 700 : 500,
                      color: selectedDay === item.date ? '#2563EB' : '#94a3b8',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="an-chart-metrics">
        <div>
          <div className="an-metric-block-label">Eng yuqori kun</div>
          <div className="an-metric-block-val">
            {peakDay && peakDay.total > 0 ? `${peakDay.label} · ${fmtMoney(peakDay.total, { showCurrency: false })}` : '—'}
          </div>
        </div>
        <div>
          <div className="an-metric-block-label">Kunlik o‘rtacha</div>
          <div className="an-metric-block-val">
            {fmtMoney(avgDailyTurnover, { showCurrency: false })}
          </div>
        </div>
        <div>
          <div className="an-metric-block-label">Savdo bo‘lgan kunlar</div>
          <div className="an-metric-block-val">
            {activeDaysCount} / {chartData.length} kun
          </div>
        </div>
      </div>
    </div>
  );
}
