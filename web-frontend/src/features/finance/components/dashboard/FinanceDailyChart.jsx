import { useState } from 'react';
import { formatMoney } from '../../utils/shared/formatMoney';
import FinanceChartDayDetailModal from './FinanceChartDayDetailModal';
import '../../../../styles/finance/daily-chart.css';
import '../../../../styles/finance/chart-tooltip.css';

export default function FinanceDailyChart({ days, t, title }) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [detailDay, setDetailDay] = useState(null);

  if (!days?.length) {
    return null;
  }

  const maxValue = Math.max(
    ...days.flatMap((d) => [Number(d.income) || 0, Number(d.expense) || 0]),
    1
  );

  return (
    <>
      <section className="finance-daily-chart">
        <h2 className="finance-daily-chart__title">{title ?? t('finance.dashboard.last7Days')}</h2>
        <div className="finance-daily-chart__legend">
          <span className="finance-daily-chart__legend-item finance-daily-chart__legend-item--income">
            {t('finance.dashboard.income')}
          </span>
          <span className="finance-daily-chart__legend-item finance-daily-chart__legend-item--expense">
            {t('finance.dashboard.expense')}
          </span>
        </div>
        <div
          className="finance-daily-chart__grid"
          style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 31)}, minmax(2rem, 1fr))` }}
        >
          {days.map((day) => {
            const incomeHeight = `${((Number(day.income) || 0) / maxValue) * 100}%`;
            const expenseHeight = `${((Number(day.expense) || 0) / maxValue) * 100}%`;
            const label = day.date?.slice(5) ?? '';
            const isHovered = hoveredDate === day.date;
            const isActive = detailDay?.date === day.date;

            return (
              <div
                key={day.date}
                className={`finance-daily-chart__column ${isActive ? 'finance-daily-chart__column--active' : ''}`}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredDate(day.date)}
                onMouseLeave={() => setHoveredDate(null)}
                onFocus={() => setHoveredDate(day.date)}
                onBlur={() => setHoveredDate(null)}
                onClick={() => setDetailDay(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailDay(day);
                  }
                }}
              >
                {isHovered ? (
                  <div className="finance-chart-tooltip" role="tooltip">
                    <span className="finance-chart-tooltip__date">{day.date}</span>
                    <div className="finance-chart-tooltip__row finance-chart-tooltip__row--income">
                      <span>{t('finance.dashboard.income')}</span>
                      <span>+{formatMoney(day.income)}</span>
                    </div>
                    <div className="finance-chart-tooltip__row finance-chart-tooltip__row--expense">
                      <span>{t('finance.dashboard.expense')}</span>
                      <span>-{formatMoney(day.expense)}</span>
                    </div>
                    <span className="finance-chart-tooltip__hint">{t('finance.detail.chartClickHint')}</span>
                  </div>
                ) : null}
                <div className="finance-daily-chart__bars">
                  <div
                    className="finance-daily-chart__bar finance-daily-chart__bar--income"
                    style={{ height: incomeHeight }}
                  />
                  <div
                    className="finance-daily-chart__bar finance-daily-chart__bar--expense"
                    style={{ height: expenseHeight }}
                  />
                </div>
                <span className="finance-daily-chart__label">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <FinanceChartDayDetailModal
        open={!!detailDay}
        onClose={() => setDetailDay(null)}
        day={detailDay}
        t={t}
      />
    </>
  );
}
