import { useState } from 'react';
import { BaseModal, BaseSelect } from '../../../../components/ui';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
  preventNonNumericKey,
} from '../../../billing/utils/parseMoneyInput';
import { PAYMENT_METHODS } from '../../hooks/useBillingCollections';

export const MAX_PAYMENT_AMOUNT = 1_000_000_000;

export default function BillingAddPaymentModal({ t, companies, initialCompanyId, busy, onClose, onSubmit }) {
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const companyList = Array.isArray(companies) ? companies : [];
  const normalizeId = (id) => {
    if (typeof id === 'number') return String(id);
    if (typeof id === 'string' && id !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null && 'companyId' in id) return String(id.companyId);
    return '';
  };
  const [companyId, setCompanyId] = useState(() => normalizeId(initialCompanyId));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [comment, setComment] = useState('');

  const parsed = parseMoneyInput(amount);
  const isZero = amount.trim() !== '' && parsed === 0;
  const isTooLarge = parsed != null && parsed > MAX_PAYMENT_AMOUNT;
  const valid = Boolean(companyId) && parsed != null && parsed > 0 && !isTooLarge;

  const submit = (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    onSubmit({ companyId: Number(companyId), amount: parsed, method, transactionId, comment });
  };

  return (
    <BaseModal
      title={k('addPaymentTitle')}
      onClose={onClose}
      className="billing-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      footer={(
        <div className="flex justify-end gap-2 w-full">
          <button type="button" className="aa-btn aa-btn--secondary aa-size-md cursor-pointer" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" form="bc-add-payment" className="aa-btn aa-btn--primary aa-size-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={!valid || busy}>
            {k('savePayment')}
          </button>
        </div>
      )}
    >
      <form id="bc-add-payment" className="bc-form space-y-4" onSubmit={submit}>
        <label className="bc-form__field flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-aa-ink-muted">{k('colCompany')} *</span>
          <BaseSelect
            variant="aa"
            size="md"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder={k('pickCompany')}
            options={companyList.map((row) => ({
              value: String(row.billing?.companyId ?? row.id ?? ''),
              label: `${row.billing?.companyName || row.name || `#${row.billing?.companyId ?? row.id}`} (ID ${row.billing?.companyId ?? row.id})`,
            }))}
            searchable
            required
          />
        </label>
        <div className="bc-form__row grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="bc-form__field flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-aa-ink-muted">{k('amount')} *</span>
            <input
              className="bc-control h-10 sm:h-10 h-11 px-3 rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink text-sm focus:border-aa-brand focus:ring-1 focus:ring-aa-brand focus:outline-none transition-all w-full"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onKeyDown={preventNonNumericKey}
              onChange={(e) => setAmount(formatMoneyInputDigits(e.target.value))}
              placeholder="1 000 000"
              required
              data-autofocus={Boolean(companyId)}
            />
            {isZero && (
              <p className="text-xs text-aa-danger mt-1 font-medium">
                {t('platform.billing.amountMustBePositive', { defaultValue: 'To‘lov summasi 0 dan katta bo‘lishi kerak' })}
              </p>
            )}
            {isTooLarge && (
              <p className="text-xs text-aa-danger mt-1 font-medium">
                {t('platform.billing.amountTooLarge', { defaultValue: 'Maksimal to‘lov summasi 1 000 000 000 so‘m' })}
              </p>
            )}
          </label>
          <label className="bc-form__field flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-aa-ink-muted">{k('colMethod')} *</span>
            <BaseSelect
              variant="aa"
              size="md"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={PAYMENT_METHODS.map((m) => ({
                value: m,
                label: k(`methods.${m}`),
              }))}
              searchable={false}
            />
          </label>
        </div>
        <label className="bc-form__field flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-aa-ink-muted">{k('transactionId')}</span>
          <input
            className="bc-control h-10 sm:h-10 h-11 px-3 rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink text-sm focus:border-aa-brand focus:ring-1 focus:ring-aa-brand focus:outline-none transition-all w-full"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
        </label>
        <label className="bc-form__field flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-aa-ink-muted">{t('platform.billing.note')}</span>
          <textarea
            className="bc-control px-3 py-2 rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink text-sm focus:border-aa-brand focus:ring-1 focus:ring-aa-brand focus:outline-none transition-all w-full"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
        <p className="bc-sub text-xs text-aa-ink-muted">{k('addPaymentHint')}</p>
      </form>
    </BaseModal>
  );
}
