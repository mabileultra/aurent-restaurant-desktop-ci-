import { formatMoney } from '../utils/pharmacyReceiptPricing';
import {
  PAID_METHODS,
  debtRemainder,
  paidSum,
} from '../utils/pharmacyReceiptPayments';

const METHOD_META = {
  CASH: { labelKey: 'pharmacyStock.paymentCash', hintKey: 'pharmacyStock.paymentCashHint' },
  CARD: { labelKey: 'pharmacyStock.paymentCard', hintKey: 'pharmacyStock.paymentCardHint' },
  TRANSFER: { labelKey: 'pharmacyStock.paymentTransfer', hintKey: 'pharmacyStock.paymentTransferHint' },
  DEBT: { labelKey: 'pharmacyStock.paymentDebt', hintKey: 'pharmacyStock.paymentDebtHint' },
};

/**
 * 4 способа: single select или split с суммами; долг = остаток от totalCost.
 */
export default function PharmacyReceiptPaymentFields({ t, form, onChange, totalCost }) {
  const setMode = (mode) => onChange({ ...form, mode });
  const setType = (paymentType) => onChange({ ...form, mode: 'single', paymentType });
  const setAmount = (method, value) => onChange({
    ...form,
    mode: 'split',
    amounts: { ...form.amounts, [method]: value },
  });

  const total = Number(totalCost) || 0;
  const paid = paidSum(form.amounts);
  const debt = debtRemainder(total, form.amounts);

  return (
    <div className="pharm-line-modal__field">
      <div className="pharm-line-modal__row pharm-line-modal__row--2" style={{ alignItems: 'end' }}>
        <span className="pharm-line-modal__label">{t('pharmacyStock.paymentType')}</span>
        <button
          type="button"
          className="pharm-product-modal__icon-btn"
          style={{ width: 'auto', padding: '0 10px', fontSize: 12 }}
          onClick={() => setMode(form.mode === 'split' ? 'single' : 'split')}
        >
          {form.mode === 'split'
            ? t('pharmacyStock.paymentModeSingle')
            : t('pharmacyStock.paymentModeSplit')}
        </button>
      </div>

      {form.mode !== 'split' ? (
        <div className="space-y-1.5 mt-1">
          {['CASH', 'CARD', 'TRANSFER', 'DEBT'].map((method) => {
            const meta = METHOD_META[method];
            return (
              <label
                key={method}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700"
              >
                <input
                  type="radio"
                  className="mt-1"
                  name="pharm-receipt-pay"
                  checked={form.paymentType === method}
                  onChange={() => setType(method)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t(meta.labelKey)}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{t(meta.hintKey)}</span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2 mt-1">
          {PAID_METHODS.map((method) => {
            const meta = METHOD_META[method];
            return (
              <label key={method} className="pharm-line-modal__field">
                <span className="pharm-line-modal__label">
                  {t(meta.labelKey)}
                  <span className="ml-1 font-normal text-slate-500">· {t(meta.hintKey)}</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pharm-line-modal__input pharm-line-modal__input--num"
                  value={form.amounts[method]}
                  onChange={(e) => setAmount(method, e.target.value)}
                  placeholder="0"
                />
              </label>
            );
          })}
          <div className="rounded-lg border border-dashed border-slate-300 px-2.5 py-2 text-sm dark:border-slate-600">
            <div className="flex justify-between gap-2">
              <span>{t('pharmacyStock.paymentDebt')}</span>
              <span className="font-medium">{formatMoney(debt)}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('pharmacyStock.paymentDebtAutoHint')}
            </div>
            {total > 0 ? (
              <div className="mt-1 flex justify-between gap-2 text-xs text-slate-500">
                <span>{t('pharmacyStock.paymentPaidOfTotal')}</span>
                <span>{formatMoney(paid)} / {formatMoney(total)}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
