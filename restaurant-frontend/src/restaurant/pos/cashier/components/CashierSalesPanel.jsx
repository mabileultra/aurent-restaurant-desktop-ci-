import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import CounterOrdersBoard from '../../components/CounterOrdersBoard';
import CashierPaidReceiptsWorkspace from './CashierPaidReceiptsWorkspace';
import CashierPaidReturnModal from './CashierPaidReturnModal';
import { useCashierRecentSales } from '../hooks/useCashierRecentSales';
import '../styles/cashier-sales-panel.css';

const SALES_VIEWS = ['takeaway', 'delivery', 'paid'];

/**
 * Takeaway / delivery active board + paid receipts master-detail.
 */
export default function CashierSalesPanel({ p, setFullOrder }) {
  const qc = useQueryClient();
  const [salesView, setSalesView] = useState(
    p.posMode === 'delivery' ? 'delivery' : 'takeaway',
  );
  const [selectedId, setSelectedId] = useState(null);
  const [returnSale, setReturnSale] = useState(null);

  const recent = useCashierRecentSales({
    storeId: p.workspace.storeId,
    storeName: p.workspace.storeName,
    waiterNameById: p.waiterNameById,
    refunded: false,
    enabled: p.tab === 'sales' && salesView === 'paid',
    t: p.t,
  });

  const selectView = (view) => {
    setSalesView(view);
    setSelectedId(null);
    setReturnSale(null);
    if (view === 'takeaway') p.changePosMode('takeaway');
    if (view === 'delivery') p.changePosMode('delivery');
  };

  const handleRowClick = (row) => {
    setSelectedId((prev) => (prev === row.id ? null : row.id));
  };

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['rst-recent-paid', p.workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-receipt-sale', selectedId] });
    setReturnSale(null);
    recent.refetch();
  };

  const showCounter = salesView === 'takeaway' || salesView === 'delivery';

  return (
    <div className="rst-cashier-panel rst-cashier-sales">
      <div className="rst-floor-section-tabs" role="tablist">
        {SALES_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={salesView === view}
            className={`rst-floor-section-tabs__btn${salesView === view ? ' is-active' : ''}`}
            onClick={() => selectView(view)}
          >
            {view === 'takeaway' && p.t('rst.pos.takeaway')}
            {view === 'delivery' && p.t('rst.pos.delivery')}
            {view === 'paid' && p.t('rst.cashier.tabPaidReceipts')}
          </button>
        ))}
      </div>

      {showCounter ? (
        <>
          {p.isError ? <div className="rst-notice">{p.t('rst.pos.counterLoadFailed')}</div> : null}
          <CounterOrdersBoard
            channel={p.channel}
            orders={p.counterOrders}
            loading={p.counterLoading}
            onOpenNew={p.handleOpenCounter}
            onSelect={(id) => {
              p.setActiveOrderId(id);
              setFullOrder(true);
            }}
            t={p.t}
          />
        </>
      ) : (
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
            onSelectRow={handleRowClick}
            onClearSelection={() => setSelectedId(null)}
            storeName={p.workspace.storeName}
            waiterNameById={p.waiterNameById}
            returnDisabled={!!returnSale}
            onReturn={(sale) => setReturnSale(sale)}
            emptyText={p.t('rst.cashier.recentSalesEmpty')}
            t={p.t}
          />
        </div>
      )}

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
