import BillingPeriodCalendar from '../BillingPeriodCalendar';
import PlatformSelect from '../PlatformSelect';

export default function BillingCompanyManage({ p }) {
  const { t } = p;
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
          onChange={(e) => p.setMonthlyAmount(e.target.value)}
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
      <p className="billing-manage__hint">{t('platform.billing.periodStartHint')}</p>
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
            onChange={(e) => p.setAdjustAmount(e.target.value)}
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
          <button type="button" className="billing-btn billing-btn--blue" disabled={p.busy || !p.adjustAmountValid} onClick={p.debit}>
            {t('platform.billing.debit')}
          </button>
          {p.selected.status === 'BLOCKED' ? (
            <button type="button" className="billing-btn billing-btn--violet" disabled={p.busy} onClick={p.unblock}>
              {t('platform.billing.unblock')}
            </button>
          ) : (
            <button type="button" className="billing-btn billing-btn--danger" disabled={p.busy} onClick={p.block}>
              {t('platform.billing.block')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
