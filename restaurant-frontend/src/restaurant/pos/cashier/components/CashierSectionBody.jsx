import { BaseButton } from '../../../../components/ui';
import BookingWorkspace from '../../../shared/components/BookingWorkspace';
import CashierHallRail from './CashierHallRail';
import CashierTableBoard from './CashierTableBoard';
import CashierOrderDock from './CashierOrderDock';
import CashierOrdersList from './CashierOrdersList';
import CashierSalesPanel from './CashierSalesPanel';
import CashierReturnsPanel from './CashierReturnsPanel';
import { isCashierHallTab } from '../utils/cashierNav';

function Placeholder({ title, text, actionLabel, onAction }) {
  return (
    <div className="rst-cashier-placeholder">
      <h2>{title}</h2>
      <p>{text}</p>
      {actionLabel && onAction ? (
        <BaseButton type="button" onClick={onAction}>{actionLabel}</BaseButton>
      ) : null}
    </div>
  );
}

export default function CashierSectionBody({ p, fullOrder, setFullOrder }) {
  const tab = p.tab;
  const tableCode = p.hallTables.find(
    (row) => (row.activeOrder?.id ?? row.activeOrderId) === p.activeOrderId,
  )?.code;

  if (isCashierHallTab(tab)) {
    return (
      <div className="rst-cashier__stage">
        <CashierHallRail
          halls={p.halls}
          selectedHallId={p.selectedHallId}
          onSelectHall={p.setSelectedHallId}
          t={p.t}
        />
        <CashierTableBoard
          tables={p.hallTables}
          halls={p.halls}
          statusFilter={p.statusFilter}
          selectedTableId={p.selectedTableId}
          activeOrderId={p.activeOrderId}
          onTableClick={p.selectTable}
          onPrefetchOrder={p.prefetchOrder}
          t={p.t}
        />
        {!fullOrder ? (
          <CashierOrderDock
            order={p.order}
            loading={false}
            linesPending={!!p.orderPartial}
            tableCode={tableCode}
            waiterName={
              p.order?.waiterUserId
                ? (p.waiterNameById.get(String(p.order.waiterUserId)) || null)
                : null
            }
            menuItems={p.menuItems ?? []}
            canRequestBill={p.canRequestBill}
            canPay={p.canPay}
            canSendKitchen={p.canSendKitchen}
            billingPending={p.billMutation.isPending}
            paying={p.payMutation.isPending}
            sendingKitchen={p.sendKitchenMutation.isPending}
            servicePreview={p.servicePreview}
            onOpenFull={() => setFullOrder(true)}
            onSendKitchen={() => p.sendKitchenMutation.mutate()}
            onRequestBill={() => p.billMutation.mutate()}
            onPay={p.openPayModal}
            onRemove={(itemId) => p.removeItemMutation.mutate(itemId)}
            onQty={p.handleQty}
            allowKitchenRefuse={!!p.access?.canCancelOrder}
            onClear={p.clearOrder}
            t={p.t}
          />
        ) : null}
      </div>
    );
  }

  if (tab === 'sales') {
    return <CashierSalesPanel p={p} setFullOrder={setFullOrder} />;
  }

  if (tab === 'orders') {
    return (
      <div className="rst-cashier-panel">
        <h2 className="rst-cashier-halls__title">{p.t('rst.cashier.tabOrders')}</h2>
        <CashierOrdersList
          tables={p.hallTables}
          waiterNameById={p.waiterNameById}
          onSelect={p.selectTable}
          emptyText={p.t('rst.cashier.ordersEmpty')}
          t={p.t}
        />
      </div>
    );
  }

  if (tab === 'bookings') {
    return (
      <div className="rst-cashier-panel">
        <BookingWorkspace
          compact
          access={{
            canCreate: p.access.canCreateBooking,
            canManage: p.access.canManageBooking,
          }}
        />
      </div>
    );
  }

  if (tab === 'payment') {
    return (
      <div className="rst-cashier-panel">
        <h2 className="rst-cashier-halls__title">{p.t('rst.cashier.tabPayment')}</h2>
        <CashierOrdersList
          tables={p.hallTables}
          onlyWaitingPayment
          waiterNameById={p.waiterNameById}
          onSelect={p.selectTable}
          emptyText={p.t('rst.cashier.paymentEmpty')}
          t={p.t}
        />
      </div>
    );
  }

  if (tab === 'returns') {
    return <CashierReturnsPanel p={p} />;
  }

  return null;
}
