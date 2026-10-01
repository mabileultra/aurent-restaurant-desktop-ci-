import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import CashierPaidReceiptsWorkspace from './CashierPaidReceiptsWorkspace';
import CashierPaidReturnModal from './CashierPaidReturnModal';
import CashierPanelBack from './CashierPanelBack';
import { useCashierRecentSales } from '../hooks/useCashierRecentSales';
import '../styles/cashier-sales-panel.css';

/**
 * Paid receipts journal — opened from cashier header.
 */
export default function CashierPaidPanel({ p }) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [returnSale, setReturnSale] = useState(null);

  const recent = useCashierRecentSales({
    storeId: p.workspace.storeId,
    storeName: p.workspace.storeName,
    waiterNameById: p.waiterNameById,
    refunded: false,
    enabled: p.tab === 'paid',
    t: p.t,
  });

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['rst-recent-paid', p.workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-receipt-sale', selectedId] });
    setReturnSale(null);
    recent.refetch();
  };

  return (
    <div className="rst-cashier-panel rst-cashier-sales">
      <CashierPanelBack
        label={p.t('rst.cashier.backToCashier')}
        onBack={() => p.setTab('hall')}
      />
      <div className="rst-cashier-sales__paid">
        {recent.isError ? (
          <div className="rst-notice rst-cashier-sales__error">
            <span>{p.t('rst.cashier.recentSalesLoadFailed')}</span>
            <button type="button" className="rst-cashier-sales__retry" onClick={() => recent.refetch()}>
              {p.t('common.retry')}
            </button>
          </div>
        ) : null}
        <CashierPaidReceiptsWorkspace
          rows={recent.rows}
          loading={recent.loading}
          selectedId={selectedId}
          onSelectRow={(row) => setSelectedId((prev) => (prev === row.id ? null : row.id))}
          onClearSelection={() => setSelectedId(null)}
          storeName={p.workspace.storeName}
          waiterNameById={p.waiterNameById}
          returnDisabled={!!returnSale}
          onReturn={(sale) => setReturnSale(sale)}
          emptyText={p.t('rst.cashier.recentSalesEmpty')}
          t={p.t}
        />
      </div>

      <CashierPaidReturnModal
        open={!!returnSale}
        sale={returnSale}
        onClose={() => setReturnSale(null)}
        onSuccess={handleReturnSuccess}
        t={p.t}
      />
    </div>
  );
}
