import React from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, PauseCircle } from 'lucide-react';

export default function BillingCalendarKpis({ t, kpis, sum }) {
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);

  return (
    <div className="bc-calendar-kpi-grid">
      {/* 1. Shu oyda to'lanishi kerak */}
      <div className="bc-cal-kpi-card bc-cal-kpi-card--primary">
        <div className="bc-cal-kpi-card__top">
          <span className="bc-cal-kpi-card__icon bc-cal-kpi-card__icon--blue">
            <Calendar size={18} aria-hidden />
          </span>
          <span className="bc-cal-kpi-card__label">
            {k('kpiDueThisMonth', { defaultValue: 'Shu oyda to‘lanishi kerak' })}
          </span>
        </div>
        <div className="bc-cal-kpi-card__val">
          {sum(kpis?.monthTotal?.amount || 0)}
        </div>
        <div className="bc-cal-kpi-card__sub">
          {kpis?.monthTotal?.count || 0} {t('platform.billing.collections.calendar.chargesUnit', { defaultValue: 'ta yechish' })}
        </div>
      </div>

      {/* 2. Muvaffaqiyatli yechilgan */}
      <div className="bc-cal-kpi-card bc-cal-kpi-card--success">
        <div className="bc-cal-kpi-card__top">
          <span className="bc-cal-kpi-card__icon bc-cal-kpi-card__icon--emerald">
            <CheckCircle2 size={18} aria-hidden />
          </span>
          <span className="bc-cal-kpi-card__label">
            {k('kpiSuccessful', { defaultValue: 'Muvaffaqiyatli yechilgan' })}
          </span>
        </div>
        <div className="bc-cal-kpi-card__val">
          {sum(kpis?.successful?.amount || 0)}
        </div>
        <div className="bc-cal-kpi-card__sub">
          {kpis?.successful?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </div>
      </div>

      {/* 3. Balans yetarli emas */}
      <div className="bc-cal-kpi-card bc-cal-kpi-card--danger">
        <div className="bc-cal-kpi-card__top">
          <span className="bc-cal-kpi-card__icon bc-cal-kpi-card__icon--rose">
            <AlertCircle size={18} aria-hidden />
          </span>
          <span className="bc-cal-kpi-card__label">
            {k('kpiLowBalance', { defaultValue: 'Balans yetarli emas' })}
          </span>
        </div>
        <div className={`bc-cal-kpi-card__val ${(kpis?.lowBalance?.amount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
          {sum(kpis?.lowBalance?.amount || 0)}
        </div>
        <div className="bc-cal-kpi-card__sub">
          {kpis?.lowBalance?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </div>
      </div>

      {/* 4. Kechiktirish berilgan */}
      <div className="bc-cal-kpi-card bc-cal-kpi-card--warning">
        <div className="bc-cal-kpi-card__top">
          <span className="bc-cal-kpi-card__icon bc-cal-kpi-card__icon--amber">
            <Clock size={18} aria-hidden />
          </span>
          <span className="bc-cal-kpi-card__label">
            {k('kpiDeferral', { defaultValue: 'Kechiktirish berilgan' })}
          </span>
        </div>
        <div className="bc-cal-kpi-card__val">
          {sum(kpis?.deferral?.amount || 0)}
        </div>
        <div className="bc-cal-kpi-card__sub">
          {kpis?.deferral?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </div>
      </div>

      {/* 5. To'xtatilgan */}
      <div className="bc-cal-kpi-card bc-cal-kpi-card--neutral">
        <div className="bc-cal-kpi-card__top">
          <span className="bc-cal-kpi-card__icon bc-cal-kpi-card__icon--slate">
            <PauseCircle size={18} aria-hidden />
          </span>
          <span className="bc-cal-kpi-card__label">
            {k('kpiSuspended', { defaultValue: 'To‘xtatilgan' })}
          </span>
        </div>
        <div className="bc-cal-kpi-card__val">
          {sum(kpis?.suspended?.amount || 0)}
        </div>
        <div className="bc-cal-kpi-card__sub">
          {kpis?.suspended?.count || 0} {t('platform.billing.collections.calendar.companiesUnit', { defaultValue: 'ta kompaniya' })}
        </div>
      </div>
    </div>
  );
}
