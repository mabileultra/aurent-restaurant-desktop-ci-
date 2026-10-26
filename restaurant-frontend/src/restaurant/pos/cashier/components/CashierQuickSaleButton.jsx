import { useCashierQuickSale } from '../hooks/useCashierQuickSale';
import '../styles/cashier-quick-sale.css';

export default function CashierQuickSaleButton({
  enabled = false,
  storeId,
  shift,
  onOpened,
  t,
}) {
  const sale = useCashierQuickSale({ storeId, shift, onOpened });
  if (!enabled) return null;

  return (
    <button
      type="button"
      className="rst-cashier-quick"
      disabled={sale.pending}
      onClick={sale.start}
    >
      {sale.pending ? t('common.loading') : t('rst.cashier.quickSale')}
    </button>
  );
}
