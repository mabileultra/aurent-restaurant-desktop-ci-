import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import { BaseModal } from '../../../../components/ui';
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
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" className="bc-btn bc-btn--outline" onClick={a.closeBulk}>{t('common.cancel')}</button>
          <button type="button" className="bc-btn bc-btn--primary" disabled={!valid || a.bulkBusy} onClick={submit}>
            {k('confirm', { count: targets.length })}
          </button>
        </div>
      )}
    >
      <div className="bc-form space-y-4">
        {isPlan ? (
          <label className="bc-form__field">
            <span>{t('platform.billing.collections.colPlan')} *</span>
            <PlatformSelect
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
          <label className="bc-form__field">
            <span>{t('platform.billing.collections.colNext')} *</span>
            <PlatformDatePicker
              min={today}
              value={date}
              onChange={setDate}
              className="w-full"
              t={t}
            />
          </label>
        )}

        {/* Company Preview Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.billing.collections.bulk.selected', { count: targets.length })}
            </span>
            {hasDebt && (
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
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
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60"
                >
                  <span className="truncate max-w-[200px] font-medium text-slate-800 dark:text-slate-200">
                    {b.companyName || `#${b.companyId}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      {money(b.balance)} {currency}
                    </span>
                    {isOverdue && (
                      <span className="bc-badge bc-badge--danger text-[9px] px-1.5 py-0.2">
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
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={15} />
              <span>Qarzdor kompaniyalar mavjud</span>
            </div>
            <p>
              Tanlangan kompaniyalar orasida {indebtedTargets.length} ta qarzi bor kompaniya bor.
              Sana o‘zgartirilsa, avtomatik yechish kechiktirilishi mumkin.
            </p>
          </div>
        )}

        <p className="bc-warn text-xs">
          <AlertTriangle size={15} aria-hidden />
          <span>{isPlan ? k('planWarning') : k('dateWarning')}</span>
        </p>

        {a.bulkSkipped ? <p className="bc-sub text-xs">{k('skipped', { count: a.bulkSkipped })}</p> : null}

        {/* Explicit confirmation checkbox */}
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>{t('platform.billing.collections.bulk.confirmCheckbox', { defaultValue: 'Amalni bajarishni tasdiqlayman' })}</span>
        </label>
      </div>
    </BaseModal>
  );
}
