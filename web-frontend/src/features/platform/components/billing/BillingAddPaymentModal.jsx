import { useState } from 'react';
import { BaseModal } from '../../../../components/ui';
import PlatformSelect from '../PlatformSelect';
import { parseMoneyInput } from '../../../billing/utils/parseMoneyInput';
import { PAYMENT_METHODS } from '../../hooks/useBillingCollections';

export default function BillingAddPaymentModal({ t, companies, initialCompanyId, busy, onClose, onSubmit }) {
  const k = (key) => t(`platform.billing.collections.${key}`);
  const [companyId, setCompanyId] = useState(initialCompanyId ? String(initialCompanyId) : '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [comment, setComment] = useState('');
  const parsed = parseMoneyInput(amount);
  const valid = Boolean(companyId) && parsed != null;

  const submit = (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    onSubmit({ companyId: Number(companyId), amount: parsed, method, transactionId, comment });
  };

  return (
    <BaseModal
      title={k('addPaymentTitle')}
      onClose={onClose}
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" className="bc-btn bc-btn--outline" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" form="bc-add-payment" className="bc-btn bc-btn--primary" disabled={!valid || busy}>
            {k('savePayment')}
          </button>
        </div>
      )}
    >
      <form id="bc-add-payment" className="bc-form" onSubmit={submit}>
        <label className="bc-form__field">
          <span>{k('colCompany')} *</span>
          <PlatformSelect
            size="md"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder={k('pickCompany')}
            options={companies.map((row) => ({
              value: String(row.billing.companyId),
              label: `${row.billing.companyName || `#${row.billing.companyId}`} (ID ${row.billing.companyId})`,
            }))}
            searchable
            required
          />
        </label>
        <div className="bc-form__row">
          <label className="bc-form__field">
            <span>{k('amount')} *</span>
            <input
              className="bc-control"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1 000 000"
              required
            />
          </label>
          <label className="bc-form__field">
            <span>{k('colMethod')} *</span>
            <PlatformSelect
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
        <label className="bc-form__field">
          <span>{k('transactionId')}</span>
          <input className="bc-control" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
        </label>
        <label className="bc-form__field">
          <span>{t('platform.billing.note')}</span>
          <textarea className="bc-control" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <p className="bc-sub">{k('addPaymentHint')}</p>
      </form>
    </BaseModal>
  );
}
