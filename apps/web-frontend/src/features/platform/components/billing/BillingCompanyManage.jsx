import React, { useState } from 'react';
import BillingPeriodCalendar from '../BillingPeriodCalendar';
import PlatformSelect from '../PlatformSelect';
import BillingCompanyManageConfirmModal from './BillingCompanyManageConfirmModal';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
  preventNonNumericKey,
} from '../../../billing/utils/parseMoneyInput';
import { MAX_BILLING_AMOUNT } from '../../hooks/billingCollectionsConstants';

export default function BillingCompanyManage({ p }) {
  const { t } = p;
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });

  const parsedAdjust = parseMoneyInput(p.adjustAmount);
  const isAdjustTooLarge = parsedAdjust != null && parsedAdjust > MAX_BILLING_AMOUNT;
  const isAdjustZero = p.adjustAmount?.trim() !== '' && parsedAdjust === 0;
  const canAdjust = Boolean(p.adjustAmountValid && !isAdjustTooLarge && !isAdjustZero && parsedAdjust > 0);

  const handleConfirmAction = () => {
    if (confirmModal.type === 'debit') return p.debit();
    if (confirmModal.type === 'credit') return p.credit();
    if (confirmModal.type === 'block') return p.block();
  };

  const companyDisplayName =
    p.selected?.companyName ||
    p.selectedRow?.billing?.companyName ||
    p.selectedRow?.companyName ||
    (p.selected?.companyId ? `#${p.selected.companyId}` : '');

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
          maxLength={15}
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
          <div>
            <input
              id="platform-topup-amount"
              className={`billing-input ${isAdjustTooLarge ? 'border-rose-500' : ''}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              value={p.adjustAmount}
              onKeyDown={preventNonNumericKey}
              onChange={(e) => p.setAdjustAmount(formatMoneyInputDigits(e.target.value))}
              placeholder={t('platform.billing.topUpAmountPlaceholder')}
            />
            {isAdjustTooLarge && (
              <p className="text-xs text-rose-600 mt-1">
                Maksimal summa: {p.money(MAX_BILLING_AMOUNT)} {t('billing.currency')}
              </p>
            )}
            {isAdjustZero && (
              <p className="text-xs text-amber-600 mt-1">
                Summa 0 dan katta bo‘lishi kerak
              </p>
            )}
          </div>
          <input
            className="billing-input"
            value={p.adjustNote}
            onChange={(e) => p.setAdjustNote(e.target.value)}
            placeholder={t('platform.billing.note')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="billing-btn billing-btn--ok"
            disabled={p.busy || !canAdjust}
            onClick={() => setConfirmModal({ isOpen: true, type: 'credit' })}
          >
            {t('platform.billing.credit')}
          </button>
          <button
            type="button"
            className="billing-btn billing-btn--blue"
            disabled={p.busy || !canAdjust}
            onClick={() => setConfirmModal({ isOpen: true, type: 'debit' })}
          >
            {t('platform.billing.debit')}
          </button>
          {p.selected?.status === 'BLOCKED' ? (
            <button type="button" className="billing-btn billing-btn--violet" disabled={p.busy} onClick={p.unblock}>
              {t('platform.billing.unblock')}
            </button>
          ) : (
            <button
              type="button"
              className="billing-btn billing-btn--danger"
              disabled={p.busy}
              onClick={() => setConfirmModal({ isOpen: true, type: 'block' })}
            >
              {t('platform.billing.block')}
            </button>
          )}
        </div>
      </div>

      <BillingCompanyManageConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        companyName={companyDisplayName}
        formattedAmount={p.money(parsedAdjust || 0)}
        currency={t('billing.currency')}
        busy={p.busy}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        t={t}
      />
    </div>
  );
}
