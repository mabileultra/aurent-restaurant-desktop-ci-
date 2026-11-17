import React from 'react';
import BillingPaymentsList from './BillingPaymentsList';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
  preventNonNumericKey,
} from '../utils/parseMoneyInput';

export default function TenantBillingQuickTopUp({ p, formatDateTime }) {
  return (
    <div id="billing-topup" className="billing-topup">
      <h3 className="billing-topup__title">{p.t('billing.quickTopUp')}</h3>
      <div className="billing-presets">
        {p.presets.map((value) => (
          <button
            key={value}
            type="button"
            className={`billing-preset ${parseMoneyInput(p.amount) === Number(value) ? 'billing-preset--active' : ''}`}
            onClick={() => p.setAmount(String(value))}
          >
            {p.money(value)}
          </button>
        ))}
      </div>
      <label className="billing-field-label" htmlFor="billing-amount">
        {p.t('billing.amountLabel')}
      </label>
      <input
        id="billing-amount"
        className="billing-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={p.amount}
        onKeyDown={preventNonNumericKey}
        onChange={(e) => p.setAmount(formatMoneyInputDigits(e.target.value))}
        placeholder={p.t('billing.customAmount')}
      />

      <button
        type="button"
        className="billing-btn billing-btn--accent"
        disabled={!p.amountValid}
        onClick={() => p.openPay()}
      >
        {p.t('billing.choosePayMethod')}
      </button>
      <p className="billing-note">{p.t('billing.autoPayHint')}</p>

      <div className="billing-manual">
        <button
          type="button"
          className="billing-link"
          onClick={() => p.setShowManual((v) => !v)}
        >
          {p.showManual ? p.t('billing.hideManual') : p.t('billing.showManual')}
        </button>

        {p.showManual ? (
          <>
            <textarea
              className="billing-textarea"
              rows={2}
              value={p.comment}
              onChange={(e) => p.setComment(e.target.value)}
              placeholder={p.t('billing.comment')}
            />
            <label className="billing-drop">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => p.setFile(e.target.files?.[0] || null)}
              />
              {p.file ? p.file.name : p.t('billing.attachFile')}
            </label>
            <button
              type="button"
              className="billing-btn billing-btn--accent"
              disabled={p.submitting || !p.amountValid}
              onClick={p.submit}
            >
              {p.submitting ? p.t('common.saving') : p.t('billing.sendToSuperAdmin')}
            </button>
            <p className="billing-note">{p.t('billing.topUpHint')}</p>
          </>
        ) : null}
      </div>

      {p.pendingTopUps.length > 0 ? (
        <p className="billing-note billing-note--warn">
          {p.t('billing.pendingCount', { count: p.pendingTopUps.length })}
        </p>
      ) : null}

      <h3 className="billing-topup__title billing-topup__title--spaced">{p.t('billing.paymentsTitle')}</h3>
      <BillingPaymentsList
        t={p.t}
        money={p.money}
        formatDateTime={formatDateTime}
        rows={p.payments}
        loading={p.paymentsLoading}
      />
    </div>
  );
}
