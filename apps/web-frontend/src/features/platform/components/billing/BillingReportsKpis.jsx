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
      <div className="aa-kpi bc-report-kpi-card bc-report-kpi-card--revenue rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <TrendingUp size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-report-kpi-card__label truncate">{k('revenue')}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-report-kpi-card__value aa-num whitespace-nowrap">
            {sum(revenueVal)}
          </span>
        </div>
        <div className="aa-kpi__meta bc-report-kpi-card__footer text-aa-ink-muted truncate">
          <span>{k('periods.DAY')}: <strong className="text-aa-ink">{sum(revenueToday)}</strong></span>
          <span className="bc-dot-sep mx-1">·</span>
          <span>{k('periods.YEAR')}: <strong className="text-aa-ink">{sum(revenueYear)}</strong></span>
        </div>
      </div>

      {/* 2. Kutilayotgan to'lovlar KPI */}
      <div className="aa-kpi bc-report-kpi-card bc-report-kpi-card--expected rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarClock size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-report-kpi-card__label truncate">{k('expected')} (7 kun)</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-report-kpi-card__value aa-num whitespace-nowrap">
            {sum(expected7)}
          </span>
        </div>
        <div className="aa-kpi__meta bc-report-kpi-card__footer text-aa-ink-muted truncate">
          <span>{k('expectedToday')}: <strong className="text-aa-ink">{sum(expectedToday)}</strong></span>
          <span className="bc-dot-sep mx-1">·</span>
          <span>{k('expected30')}: <strong className="text-aa-ink">{sum(expected30)}</strong></span>
        </div>
      </div>

      {/* 3. Qarzdorlik KPI */}
      <div className="aa-kpi bc-report-kpi-card bc-report-kpi-card--debt rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-report-kpi-card__label truncate">{k('debt')}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`aa-kpi__value bc-report-kpi-card__value aa-num whitespace-nowrap ${debtTotal > 0 ? 'text-aa-danger' : ''}`}>
            {sum(debtTotal)}
          </span>
        </div>
        <div className={`aa-kpi__meta bc-report-kpi-card__footer truncate ${debtTotal > 0 ? 'text-aa-danger' : 'text-aa-ink-muted'}`}>
          <span>{k('debtCount')}: <strong className={debtTotal > 0 ? 'text-aa-danger' : 'text-aa-ink'}>{debtCount}</strong></span>
          <span className="bc-dot-sep mx-1">·</span>
          <span>{k('debtAverage')}: <strong className={debtTotal > 0 ? 'text-aa-danger' : 'text-aa-ink'}>{sum(debtAverage)}</strong></span>
        </div>
      </div>

      {/* 4. To'lov usullari faolligi KPI */}
      <div className="aa-kpi bc-report-kpi-card bc-report-kpi-card--methods rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <CreditCard size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-report-kpi-card__label truncate">{k('methods')}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-report-kpi-card__value aa-num whitespace-nowrap">
            {sum(methodsTotal)}
          </span>
        </div>
        <div className="aa-kpi__meta bc-report-kpi-card__footer text-aa-ink-muted truncate">
          <span>{t('platform.billing.collections.reports.activeMethodsCount', { defaultValue: '5 ta to‘lov usuli' })}</span>
          <span className="bc-dot-sep mx-1">·</span>
          <span>{k(`periods.${period}`)}</span>
        </div>
      </div>
    </div>
  );
}
