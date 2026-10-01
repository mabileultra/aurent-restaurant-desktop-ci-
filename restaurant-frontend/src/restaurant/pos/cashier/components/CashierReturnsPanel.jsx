import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store/authStore';
import { toastApiError } from '../../../../utils/apiError';
import RestaurantReceiptModal from '../../components/RestaurantReceiptModal';
import { loadRestaurantReceiptSale } from '../../utils/loadRestaurantReceiptSale';
import CashierPanelBack from './CashierPanelBack';
import CashierRecentSales from './CashierRecentSales';
import { useCashierCancelledOrders } from '../hooks/useCashierCancelledOrders';
import { useCashierRecentSales } from '../hooks/useCashierRecentSales';
import '../styles/cashier-returns-panel.css';

const VIEWS = ['refusals', 'refunds'];

/**
 * Table refusals (cancelled) + money refunds — one cashier journal with two lists.
 */
export default function CashierReturnsPanel({ p }) {
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState('refusals');
  const [viewedSale, setViewedSale] = useState(null);

  const cancelled = useCashierCancelledOrders({
    storeId: p.workspace.storeId,
    enabled: p.tab === 'returns' && view === 'refusals',
  });

  const refunds = useCashierRecentSales({
    storeId: p.workspace.storeId,
    storeName: p.workspace.storeName,
    waiterNameById: p.waiterNameById,
    refunded: true,
    enabled: p.tab === 'returns' && view === 'refunds',
    t: p.t,
  });

  const openReceiptMutation = useMutation({
    mutationFn: (row) =>
      loadRestaurantReceiptSale({
        orderId: row.id,
        storeName: p.workspace.storeName,
        cashierName: user?.fullName || user?.username || undefined,
        waiterNameById: p.waiterNameById,
        t: p.t,
      }),
    onSuccess: (sale) => setViewedSale(sale),
    onError: (err) => toastApiError(err, p.t('rst.cashier.receiptLoadFailed')),
  });

  const isRefusals = view === 'refusals';
  const list = isRefusals ? cancelled : refunds;
  const listError = isRefusals ? cancelled.isError : refunds.isError;

  return (
    <div className="rst-cashier-panel rst-cashier-returns">
      <CashierPanelBack
        label={p.t('rst.cashier.backToCashier')}
        onBack={() => p.setTab('hall')}
      />
      <h2 className="rst-floor-hall-rail__title">{p.t('rst.cashier.tabReturns')}</h2>
      <p className="rst-cashier-returns-hint">{p.t('rst.cashier.returnsHint')}</p>

      <div className="rst-cashier-returns__tabs" role="tablist">
        {VIEWS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            className={`rst-cashier-returns__tab${view === key ? ' is-active' : ''}`}
            onClick={() => setView(key)}
          >
            {key === 'refusals'
              ? p.t('rst.cashier.recentRefusalsTitle')
              : p.t('rst.cashier.recentRefundsTitle')}
          </button>
        ))}
      </div>

      {listError ? (
        <div className="rst-notice">
          <span>{p.t('rst.cashier.recentSalesLoadFailed')}</span>
          <button type="button" className="rst-cashier-sales__retry" onClick={() => list.refetch()}>
            {p.t('common.retry')}
          </button>
        </div>
      ) : null}

      <CashierRecentSales
        rows={list.rows}
        loading={list.loading}
        cancelled={isRefusals}
        refunded={!isRefusals}
        hideHead
        paginate
        pageSize={12}
        onOpenReceipt={(row) => {
          if (isRefusals) openReceiptMutation.mutate(row);
          else refunds.openReceipt(row).then((sale) => setViewedSale(sale)).catch(() => {});
        }}
        openingId={
          isRefusals
            ? (openReceiptMutation.isPending ? openReceiptMutation.variables?.id ?? null : null)
            : refunds.openingId
        }
        emptyText={
          isRefusals
            ? p.t('rst.cashier.recentRefusalsEmpty')
            : p.t('rst.cashier.recentRefundsEmpty')
        }
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
