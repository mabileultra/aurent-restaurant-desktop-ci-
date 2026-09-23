import { useEffect, useState } from 'react';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { round2 } from '../../../utils/taxAmounts';

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
        <div className="rst-order-discount__modes">
          <button
            type="button"
            className={mode === 'amount' ? 'is-active' : ''}
            onClick={() => setMode('amount')}
          >
            {t('rst.order.discountAmount', { defaultValue: 'Сумма' })}
          </button>
          <button
            type="button"
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
      <style>{`
        .rst-order-discount { display: grid; gap: 12px; }
        .rst-order-discount__modes { display: flex; gap: 8px; }
        .rst-order-discount__modes button {
          flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff;
        }
        .rst-order-discount__modes button.is-active { background: #0f172a; color: #fff; border-color: #0f172a; }
        .rst-order-discount__field { display: grid; gap: 6px; font-size: 0.875rem; }
        .rst-order-discount__preview { margin: 0; font-size: 0.875rem; color: #64748b; }
        .rst-order-discount__actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
      `}</style>
    </BaseModal>
  );
}
