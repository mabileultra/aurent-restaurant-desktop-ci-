import { useCashierQuickSale } from '../hooks/useCashierQuickSale';

/** Same chrome as Оплаченные / Отказы — lives in the header quick row. */
export default function CashierQuickSaleButton({
  enabled = false,
  storeId,
  shift,
  onOpened,
  t,
  className = 'rst-cashier-top__quick-btn rst-cashier-top__quick-btn--sale',
}) {
  const sale = useCashierQuickSale({ storeId, shift, onOpened });
  if (!enabled) return null;

  return (
    <button
      type="button"
      className={className}
      disabled={sale.pending}
      onClick={sale.start}
    >
      {sale.pending ? t('common.loading') : t('rst.cashier.quickSale')}
    </button>
  );
}
