import { useState } from 'react';
import RestaurantReceiptModal from '../../components/RestaurantReceiptModal';
import CashierRecentSales from './CashierRecentSales';
import { useCashierRecentSales } from '../hooks/useCashierRecentSales';
import '../styles/cashier-returns-panel.css';

/**
 * Refunded orders journal — view / reprint receipt.
 */
export default function CashierReturnsPanel({ p }) {
  const [viewedSale, setViewedSale] = useState(null);
  const recent = useCashierRecentSales({
    storeId: p.workspace.storeId,
    storeName: p.workspace.storeName,
    waiterNameById: p.waiterNameById,
    refunded: true,
    enabled: p.tab === 'returns',
    t: p.t,
  });

  const openReceipt = async (row) => {
    try {
      const sale = await recent.openReceipt(row);
      setViewedSale(sale);
    } catch {
      /* toast in hook */
    }
  };

  return (
    <div className="rst-cashier-panel">
      <h2 className="rst-cashier-halls__title">{p.t('rst.cashier.tabReturns')}</h2>
      <p className="rst-cashier-returns-hint">{p.t('rst.cashier.returnsHint')}</p>
      {recent.isError ? (
        <div className="rst-notice">{p.t('rst.cashier.recentSalesLoadFailed')}</div>
      ) : null}
      <CashierRecentSales
        rows={recent.rows}
        loading={recent.loading}
        refunded
        onOpenReceipt={openReceipt}
        openingId={recent.openingId}
        emptyText={p.t('rst.cashier.recentRefundsEmpty')}
        t={p.t}
      />
      {viewedSale ? (
        <RestaurantReceiptModal
          sale={viewedSale}
          onClose={() => setViewedSale(null)}
          allowRefund={false}
          t={p.t}
        />
      ) : null}
    </div>
  );
}
