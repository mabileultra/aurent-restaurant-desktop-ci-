import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BaseModal } from '../../../../components/ui';
import PlatformSelect from '../PlatformSelect';
import { toIsoDate } from '../BillingPeriodCalendar';
import PlatformDatePicker from '../PlatformDatePicker';

export default function BillingBulkModal({ p }) {
  const { t, plans, actions: a } = p;
  const k = (key, opts) => t(`platform.billing.collections.bulk.${key}`, opts);
  const [planId, setPlanId] = useState('');
  const today = toIsoDate(new Date());
  const [date, setDate] = useState(today);
  if (!a.bulkMode) return null;

  const isPlan = a.bulkMode === 'plan';
  const plan = plans.find((x) => x.id === planId);
  const valid = a.bulkTargets.length > 0 && (isPlan ? Boolean(plan) : date >= today);

  const submit = () => {
    if (!valid || a.bulkBusy) return;
    if (isPlan) a.bulkChangePlan(plan);
    else a.bulkChangeDate(date);
  };

  return (
    <BaseModal
      title={isPlan ? k('changePlan') : k('changeDate')}
      onClose={a.closeBulk}
      size="sm"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" className="bc-btn bc-btn--outline" onClick={a.closeBulk}>{t('common.cancel')}</button>
          <button type="button" className="bc-btn bc-btn--primary" disabled={!valid || a.bulkBusy} onClick={submit}>
            {k('confirm', { count: a.bulkTargets.length })}
          </button>
        </div>
      )}
    >
      <div className="bc-form">
        {isPlan ? (
          <label className="bc-form__field">
            <span>{t('platform.billing.collections.colPlan')}</span>
            <PlatformSelect
              size="md"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder={t('platform.billing.pickPlan')}
              options={plans.filter((x) => x.active !== false).map((x) => ({
                value: x.id,
                label: `${x.name} — ${p.money(x.monthlyPrice)}`,
              }))}
              searchable={plans.length > 5}
            />
          </label>
        ) : (
          <label className="bc-form__field">
            <span>{t('platform.billing.collections.colNext')}</span>
            <PlatformDatePicker
              min={today}
              value={date}
              onChange={setDate}
              className="w-full"
              t={t}
            />
          </label>
        )}
        <p className="bc-warn">
          <AlertTriangle size={16} aria-hidden />
          {isPlan ? k('planWarning') : k('dateWarning')}
        </p>
        {a.bulkSkipped ? <p className="bc-sub">{k('skipped', { count: a.bulkSkipped })}</p> : null}
      </div>
    </BaseModal>
  );
}
