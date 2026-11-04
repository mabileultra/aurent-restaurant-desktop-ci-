import { useEffect, useState } from 'react';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { round2 } from '../../../utils/taxAmounts';
import '../styles/order-discount-modal.css';

export default function OrderDiscountModal({
  open,
  subtotal,
  currentDiscount = 0,
  saving,
  onClose,
  onSubmit,
  t,
}) {
  const [mode, setMode] = useState('amount'); // amount | percent
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('amount');
    setValue(currentDiscount > 0 ? String(currentDiscount) : '');
  }, [open, currentDiscount]);

  if (!open) return null;

  const raw = Number(String(value).replace(',', '.')) || 0;
  const max = round2(Number(subtotal) || 0);
  const computed = mode === 'percent'
    ? round2(max * Math.min(100, Math.max(0, raw)) / 100)
    : round2(Math.min(max, Math.max(0, raw)));

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('rst.order.discountTitle', { defaultValue: 'Скидка на заказ' })}
    >
      <form
        className="rst-order-discount"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(computed);
        }}
      >
        <div className="rst-order-discount__modes" role="tablist" aria-label={t('rst.order.discountTitle')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'amount'}
            className={mode === 'amount' ? 'is-active' : ''}
            onClick={() => setMode('amount')}
          >
            {t('rst.order.discountAmount', { defaultValue: 'Сумма' })}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'percent'}
            className={mode === 'percent' ? 'is-active' : ''}
            onClick={() => setMode('percent')}
          >
            {t('rst.order.discountPercent', { defaultValue: '%' })}
          </button>
        </div>

        <label className="rst-order-discount__field">
          <span>
            {mode === 'percent'
              ? t('rst.order.discountPercentLabel', { defaultValue: 'Процент' })
              : t('rst.order.discountAmountLabel', { defaultValue: 'Сумма скидки' })}
          </span>
          <BaseInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            autoFocus
          />
        </label>

        <p className="rst-order-discount__preview">
          {t('rst.order.discountPreview', {
            defaultValue: 'Скидка: {{amount}} (макс. {{max}})',
            amount: fmtMoneyCompact(computed),
            max: fmtMoneyCompact(max),
          })}
        </p>

        <div className="rst-order-discount__actions">
          <BaseButton type="button" variant="ghost" onClick={() => onSubmit(0)} disabled={saving}>
            {t('rst.order.discountClear', { defaultValue: 'Сбросить' })}
          </BaseButton>
          <BaseButton type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="submit" disabled={saving}>{t('common.save')}</BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
