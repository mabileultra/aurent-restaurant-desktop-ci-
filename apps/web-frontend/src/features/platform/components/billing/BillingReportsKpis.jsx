import React from 'react';
import { AlertCircle, CalendarClock, CreditCard, TrendingUp } from 'lucide-react';

export default function BillingReportsKpis({ t, r = {}, sum, period }) {
  const k = (key, opts) => t(`platform.billing.collections.reports.${key}`, opts);
  const REVENUE_FIELD = { DAY: 'today', WEEK: 'week', MONTH: 'month', YEAR: 'year' };

  const methodsTotal = (r?.methods || []).reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const revenue = r?.revenue || {};
  const expected = r?.expected || {};
  const debt = r?.debt || {};

  const revenueVal = revenue[REVENUE_FIELD[period] || 'month'] || 0;
  const revenueToday = revenue.today || 0;
  const revenueYear = revenue.year || 0;

  const expected7 = expected.next7Days || 0;
  const expectedToday = expected.today || 0;
  const expected30 = expected.next30Days || 0;

  const debtTotal = Number(debt.total || 0);
  const debtCount = Number(debt.count || 0);
  const debtAverage = Number(debt.average || 0);

  return (
    <div className="bc-reports-kpi-grid">
      {/* 1. Tushum KPI */}
      <div className="bc-report-kpi-card bc-report-kpi-card--revenue">
        <div className="bc-report-kpi-card__top">
          <span className="bc-report-kpi-card__label">{k('revenue')}</span>
          <span className="bc-report-kpi-card__icon bc-kpi--success">
            <TrendingUp size={18} aria-hidden />
          </span>
        </div>
        <div className="bc-report-kpi-card__value">
          {sum(revenueVal)}
        </div>
        <div className="bc-report-kpi-card__footer">
          <span>{k('periods.DAY')}: <strong>{sum(revenueToday)}</strong></span>
          <span className="bc-dot-sep">·</span>
          <span>{k('periods.YEAR')}: <strong>{sum(revenueYear)}</strong></span>
        </div>
      </div>

      {/* 2. Kutilayotgan to'lovlar KPI */}
      <div className="bc-report-kpi-card bc-report-kpi-card--expected">
        <div className="bc-report-kpi-card__top">
          <span className="bc-report-kpi-card__label">{k('expected')}</span>
          <span className="bc-report-kpi-card__icon bc-kpi--info">
            <CalendarClock size={18} aria-hidden />
          </span>
        </div>
        <div className="bc-report-kpi-card__value">
          {sum(expected7)}
        </div>
        <div className="bc-report-kpi-card__footer">
          <span>{k('expectedToday')}: <strong>{sum(expectedToday)}</strong></span>
          <span className="bc-dot-sep">·</span>
          <span>{k('expected30')}: <strong>{sum(expected30)}</strong></span>
        </div>
      </div>

      {/* 3. Qarzdorlik KPI */}
      <div className="bc-report-kpi-card bc-report-kpi-card--debt">
        <div className="bc-report-kpi-card__top">
          <span className="bc-report-kpi-card__label">{k('debt')}</span>
          <span className="bc-report-kpi-card__icon bc-kpi--danger">
            <AlertCircle size={18} aria-hidden />
          </span>
        </div>
        <div className={`bc-report-kpi-card__value ${debtTotal > 0 ? 'bc-text--danger' : ''}`}>
          {sum(debtTotal)}
        </div>
        <div className="bc-report-kpi-card__footer">
          <span>{k('debtCount')}: <strong>{debtCount}</strong></span>
          <span className="bc-dot-sep">·</span>
          <span>{k('debtAverage')}: <strong>{sum(debtAverage)}</strong></span>
        </div>
      </div>

      {/* 4. To'lov usullari faolligi KPI */}
      <div className="bc-report-kpi-card bc-report-kpi-card--methods">
        <div className="bc-report-kpi-card__top">
          <span className="bc-report-kpi-card__label">{k('methods')}</span>
          <span className="bc-report-kpi-card__icon bc-kpi--warning">
            <CreditCard size={18} aria-hidden />
          </span>
        </div>
        <div className="bc-report-kpi-card__value">
          {sum(methodsTotal)}
        </div>
        <div className="bc-report-kpi-card__footer">
          <span>{t('platform.billing.collections.reports.activeMethodsCount', { defaultValue: '5 ta to‘lov usuli' })}</span>
          <span className="bc-dot-sep">·</span>
          <span>{k(`periods.${period}`)}</span>
        </div>
      </div>
    </div>
  );
}
