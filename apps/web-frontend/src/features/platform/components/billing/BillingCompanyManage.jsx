import React, { useMemo } from 'react';
import BillingPeriodCalendar from '../BillingPeriodCalendar';
import PlatformSelect from '../PlatformSelect';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
  preventNonNumericKey,
} from '../../../billing/utils/parseMoneyInput';

export default function BillingCompanyManage({ p }) {
  const { t } = p;
  const todayIso = new Date().toLocaleDateString('sv-SE');

  const pastMonthsInfo = useMemo(() => {
    if (!p.periodStartOn || p.periodStartOn >= todayIso) return null;
    const start = new Date(p.periodStartOn);
    const today = new Date(todayIso);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;
    const periods = Math.min(12, Math.floor(diffDays / 30) + 1);
    const monthly = parseMoneyInput(p.monthlyAmount, { allowZero: true }) || 0;
    const totalCost = periods * monthly;
    const balance = Number(p.selected?.balance || 0);
    const isCovered = balance >= totalCost;
    return {
      periods,
      totalCost,
      isCovered,
      balance,
    };
  }, [p.periodStartOn, p.monthlyAmount, p.selected?.balance, todayIso]);

  const handleDebit = () => {
    if (window.confirm(t('platform.billing.confirmDebit', { defaultValue: 'Haqiqatan ham ushbu summani yechib olmoqchimisiz?' }))) {
      p.debit();
    }
  };

  const handleBlock = () => {
    if (window.confirm(t('platform.billing.confirmBlock', { defaultValue: 'Haqiqatan ham ushbu kompaniyani bloklamoqchimisiz?' }))) {
      p.block();
    }
  };

  return (
    <div className="billing-manage bc-manage">
      <p className="billing-manage__hint">{t('platform.billing.monthlyHint')}</p>
      <label className="billing-field-label" htmlFor="platform-monthly-amount">
        {t('platform.billing.monthlyAmount')}
      </label>
      <div className="grid gap-2">
        <input
          id="platform-monthly-amount"
          className="billing-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={p.monthlyAmount}
          onKeyDown={preventNonNumericKey}
          onChange={(e) => p.setMonthlyAmount(formatMoneyInputDigits(e.target.value))}
          placeholder={t('platform.billing.monthlyAmountPlaceholder')}
        />
        <PlatformSelect
          size="md"
          value={p.assignPlanId}
          onChange={(e) => p.pickPlan(e.target.value)}
          placeholder={t('platform.billing.pickPlanOptional')}
          options={p.plans.map((plan) => ({
            value: plan.id,
            label: `${plan.name} — ${p.money(plan.monthlyPrice)}`,
          }))}
          searchable={p.plans.length > 5}
        />
      </div>

      <label className="billing-field-label">{t('platform.billing.periodStart')}</label>
      <BillingPeriodCalendar value={p.periodStartOn} onChange={p.setPeriodStartOn} locale={p.dateLocale} t={t} />

      {pastMonthsInfo ? (
        <div className={`p-2.5 rounded-lg text-xs border ${pastMonthsInfo.isCovered ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800 dark:text-amber-300'}`}>
          <div className="font-semibold mb-0.5">
            Orqaga tanlangan sana: {pastMonthsInfo.periods} ta oy ({p.money(pastMonthsInfo.totalCost)} {t('billing.currency')})
          </div>
          <div>
            {pastMonthsInfo.isCovered
              ? `Balans yetarli (${p.money(pastMonthsInfo.balance)} ${t('billing.currency')}) — o‘tkazib yuborilgan oylar darhol yechiladi.`
              : `Balans yetarli emas (${p.money(pastMonthsInfo.balance)} ${t('billing.currency')}) — yetmagan oylar uchun kompaniya qarzdorlik/grace holatiga o‘tadi.`}
          </div>
        </div>
      ) : (
        <p className="billing-manage__hint">{t('platform.billing.periodStartHint')}</p>
      )}

      {p.prepaidCover?.kind === 'ok' ? (
        <p className="billing-manage__hint billing-manage__hint--ok">{t('platform.billing.prepaidHint', p.prepaidCover)}</p>
      ) : null}
      {p.prepaidCover?.kind === 'empty' ? <p className="billing-manage__hint">{t('platform.billing.prepaidHintEmpty')}</p> : null}
      {p.prepaidCover?.kind === 'zero' ? <p className="billing-manage__hint">{t('platform.billing.prepaidHintZero')}</p> : null}
      <button
        type="button"
        className="billing-btn billing-btn--accent"
        disabled={p.busy || !p.monthlyAmountValid || !p.periodStartValid}
        onClick={p.assignPlan}
      >
        {t('platform.billing.saveMonthly')}
      </button>

      <div className="billing-manage__topup">
        <label className="billing-field-label" htmlFor="platform-topup-amount">{t('platform.billing.topUpAmount')}</label>
        <div className="grid gap-2">
          <input
            id="platform-topup-amount"
            className="billing-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={p.adjustAmount}
            onKeyDown={preventNonNumericKey}
            onChange={(e) => p.setAdjustAmount(formatMoneyInputDigits(e.target.value))}
            placeholder={t('platform.billing.topUpAmountPlaceholder')}
          />
          <input
            className="billing-input"
            value={p.adjustNote}
            onChange={(e) => p.setAdjustNote(e.target.value)}
            placeholder={t('platform.billing.note')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="billing-btn billing-btn--ok" disabled={p.busy || !p.adjustAmountValid} onClick={p.credit}>
            {t('platform.billing.credit')}
          </button>
          <button type="button" className="billing-btn billing-btn--blue" disabled={p.busy || !p.adjustAmountValid} onClick={handleDebit}>
            {t('platform.billing.debit')}
          </button>
          {p.selected.status === 'BLOCKED' ? (
            <button type="button" className="billing-btn billing-btn--violet" disabled={p.busy} onClick={p.unblock}>
              {t('platform.billing.unblock')}
            </button>
          ) : (
            <button type="button" className="billing-btn billing-btn--danger" disabled={p.busy} onClick={handleBlock}>
              {t('platform.billing.block')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
