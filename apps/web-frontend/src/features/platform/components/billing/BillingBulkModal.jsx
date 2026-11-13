import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import { BaseModal, BaseCheckbox } from '../../../../components/ui';
import PlatformSelect from '../PlatformSelect';
import { toIsoDate } from '../BillingPeriodCalendar';
import PlatformDatePicker from '../PlatformDatePicker';

export default function BillingBulkModal({ p }) {
  const { t, plans, actions: a, money } = p;
  const k = (key, opts) => t(`platform.billing.collections.bulk.${key}`, opts);
  const [planId, setPlanId] = useState('');
  const today = toIsoDate(new Date());
  const [date, setDate] = useState(today);
  const [confirmed, setConfirmed] = useState(false);

  if (!a.bulkMode) return null;

  const isPlan = a.bulkMode === 'plan';
  const plan = plans.find((x) => x.id === planId);
  const currency = t('billing.currency');

  const targets = a.bulkTargets || [];
  const indebtedTargets = useMemo(() => {
    return targets.filter((r) => {
      const b = r.billing || {};
      return Number(b.balance) < 0 || r.paymentState === 'OVERDUE';
    });
  }, [targets]);

  const hasDebt = indebtedTargets.length > 0;
  const valid = targets.length > 0 && (isPlan ? Boolean(plan) : date >= today) && confirmed;

  const submit = () => {
    if (!valid || a.bulkBusy) return;
    if (isPlan) a.bulkChangePlan(plan);
    else a.bulkChangeDate(date);
  };

  return (
    <BaseModal
      title={isPlan ? k('changePlan') : k('changeDate')}
      onClose={a.closeBulk}
      size="md"
      className="billing-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      footer={(
        <div className="flex justify-end gap-2 w-full">
          <button type="button" className="aa-btn aa-btn--secondary aa-size-md cursor-pointer" onClick={a.closeBulk}>{t('common.cancel')}</button>
          <button type="button" className="aa-btn aa-btn--primary aa-size-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={!valid || a.bulkBusy} onClick={submit}>
            {k('confirm', { count: targets.length })}
          </button>
        </div>
      )}
    >
      <div className="bc-form space-y-4">
        {isPlan ? (
          <label className="bc-form__field flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colPlan')} *</span>
            <PlatformSelect
              variant="aa"
              size="md"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder={t('platform.billing.pickPlan')}
              options={plans.filter((x) => x.active !== false).map((x) => ({
                value: x.id,
                label: `${x.name} — ${money(x.monthlyPrice)} ${currency}`,
              }))}
              searchable={plans.length > 5}
            />
          </label>
        ) : (
          <label className="bc-form__field flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colNext')} *</span>
            <PlatformDatePicker
              variant="aa"
              size="md"
              min={today}
              value={date}
              onChange={setDate}
              className="w-full"
              t={t}
            />
          </label>
        )}

        {/* Company Preview Section */}
        <div className="rounded-aa-md border border-aa-line bg-aa-surface-sunken p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-aa-ink">
              {t('platform.billing.collections.bulk.selected', { count: targets.length })}
            </span>
            {hasDebt && (
              <span className="text-xs font-bold text-aa-danger">
                {indebtedTargets.length} ta qarzdor
              </span>
            )}
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
            {targets.map((r) => {
              const b = r.billing || {};
              const isOverdue = Number(b.balance) < 0 || r.paymentState === 'OVERDUE';
              return (
                <div
                  key={b.companyId}
                  className="flex items-center justify-between p-1.5 rounded-aa-sm bg-aa-surface border border-aa-line"
                >
                  <span className="truncate max-w-[200px] font-medium text-aa-ink">
                    {b.companyName || `#${b.companyId}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isOverdue ? 'text-aa-danger font-bold' : 'text-aa-ink-muted'}`}>
                      {money(b.balance)} {currency}
                    </span>
                    {isOverdue && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-aa-danger-soft text-aa-danger border border-aa-line">
                        {t('platform.billing.collections.states.OVERDUE', { defaultValue: 'Qarz' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt warning if indebted companies are in selection */}
        {hasDebt && !isPlan && (
          <div className="p-3 rounded-aa-md bg-aa-warning-soft border border-aa-line text-xs text-aa-warning">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={15} />
              <span>Qarzdor kompaniyalar mavjud</span>
            </div>
            <p className="text-aa-ink">
              Tanlangan kompaniyalar orasida {indebtedTargets.length} ta qarzi bor kompaniya bor.
              Sana o‘zgartirilsa, avtomatik yechish kechiktirilishi mumkin.
            </p>
          </div>
        )}

        <p className="bc-warn text-xs text-aa-warning flex items-center gap-1.5">
          <AlertTriangle size={15} aria-hidden />
          <span>{isPlan ? k('planWarning') : k('dateWarning')}</span>
        </p>

        {a.bulkSkipped ? <p className="bc-sub text-xs text-aa-ink-muted">{k('skipped', { count: a.bulkSkipped })}</p> : null}

        {/* Explicit confirmation checkbox */}
        <label className="flex items-center gap-2 text-xs font-medium text-aa-ink cursor-pointer pt-1">
          <BaseCheckbox
            variant="aa"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            size={18}
          />
          <span>{t('platform.billing.collections.bulk.confirmCheckbox', { defaultValue: 'Amalni bajarishni tasdiqlayman' })}</span>
        </label>
      </div>
    </BaseModal>
  );
}
