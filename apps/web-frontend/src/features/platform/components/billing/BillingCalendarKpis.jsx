import React from 'react';
import { AlertCircle, Calendar, CalendarClock, CheckCircle2, Clock, PauseCircle } from 'lucide-react';

export default function BillingCalendarKpis({ t, kpis, sum }) {
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);

  return (
    <div className="bc-calendar-kpi-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Shu oyda to'lanishi kerak */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--primary rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiDueThisMonth', { defaultValue: 'Shu oyda to‘lanishi kerak' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-cal-kpi-card__val aa-num break-words">
            {sum(kpis?.monthTotal?.amount || 0)}
          </span>
        </div>
        <p className="aa-kpi__meta bc-cal-kpi-card__sub text-aa-ink-muted">
          {kpis?.monthTotal?.count || 0} {t('platform.billing.collections.calendar.chargesUnit', { defaultValue: 'ta yechish' })}
        </p>
      </div>

      {/* 2. Muvaffaqiyatli yechilgan */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--success rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiSuccessful', { defaultValue: 'Muvaffaqiyatli yechilgan' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-cal-kpi-card__val aa-num break-words">
            {sum(kpis?.successful?.amount || 0)}
          </span>
        </div>
        <p className="aa-kpi__meta bc-cal-kpi-card__sub text-aa-success">
          {kpis?.successful?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </p>
      </div>

      {/* 3. Rejalashtirilgan */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--info rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarClock size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiPlanned', { defaultValue: 'Rejalashtirilgan' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-cal-kpi-card__val aa-num break-words">
            {sum(kpis?.planned?.amount || 0)}
          </span>
        </div>
        <p className="aa-kpi__meta bc-cal-kpi-card__sub text-aa-ink-muted">
          {kpis?.planned?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </p>
      </div>

      {/* 4. Balans yetarli emas */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--danger rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiLowBalance', { defaultValue: 'Balans yetarli emas' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`aa-kpi__value bc-cal-kpi-card__val aa-num break-words ${(kpis?.lowBalance?.amount || 0) > 0 ? 'text-aa-danger' : ''}`}>
            {sum(kpis?.lowBalance?.amount || 0)}
          </span>
        </div>
        <p className={`aa-kpi__meta bc-cal-kpi-card__sub ${(kpis?.lowBalance?.amount || 0) > 0 ? 'text-aa-danger' : 'text-aa-ink-muted'}`}>
          {kpis?.lowBalance?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </p>
      </div>

      {/* 5. Kechiktirish berilgan */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--warning rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiDeferral', { defaultValue: 'Kechiktirish berilgan' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-cal-kpi-card__val aa-num break-words">
            {sum(kpis?.deferral?.amount || 0)}
          </span>
        </div>
        <p className="aa-kpi__meta bc-cal-kpi-card__sub text-aa-warning">
          {kpis?.deferral?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </p>
      </div>

      {/* 6. To'xtatilgan */}
      <div className="aa-kpi bc-cal-kpi-card bc-cal-kpi-card--neutral rounded-aa-lg bg-aa-surface border border-aa-line p-3.5 sm:p-4 shadow-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <PauseCircle size={16} className="text-aa-ink-muted shrink-0" aria-hidden />
          <span className="aa-kpi__label bc-cal-kpi-card__label">
            {k('kpiSuspended', { defaultValue: 'To‘xtatilgan' })}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="aa-kpi__value bc-cal-kpi-card__val aa-num break-words">
            {sum(kpis?.suspended?.amount || 0)}
          </span>
        </div>
        <p className="aa-kpi__meta bc-cal-kpi-card__sub text-aa-ink-muted">
          {kpis?.suspended?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </p>
      </div>
    </div>
  );
}
