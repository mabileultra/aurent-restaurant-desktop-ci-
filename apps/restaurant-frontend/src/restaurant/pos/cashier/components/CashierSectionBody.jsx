import { BaseButton } from '../../../../components/ui';
import BookingWorkspace from '../../../shared/components/BookingWorkspace';
import CashierHallRail from './CashierHallRail';
import CashierTableBoard from './CashierTableBoard';
import CashierOrderDock from './CashierOrderDock';
import CashierOrdersList from './CashierOrdersList';
import CashierSalesPanel from './CashierSalesPanel';
import CashierPaidPanel from './CashierPaidPanel';
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
          selectedTableId={p.selectedTableId}
          activeOrderId={p.activeOrderId}
          onTableClick={p.selectTable}
          onSelectCheck={p.selectTableCheck}
          onPrefetchOrder={p.prefetchOrder}
          t={p.t}
        />
        {!fullOrder ? (
          <CashierOrderDock
            order={p.orderForUi}
            loading={false}
            linesPending={!!p.orderPartial}
            tableCode={tableCode || p.orderForUi?.tableCode}
            hallName={(p.isDraftOrder ? p.draftHallName : p.orderHallName) || null}
            waiterName={
              p.orderForUi?.waiterUserId
                ? (p.waiterNameById.get(String(p.orderForUi.waiterUserId)) || null)
                : null
            }
            menuItems={p.menuItems ?? []}
            canRequestBill={!p.isDraftOrder && p.canRequestBill}
            canPay={!p.isDraftOrder && p.canPay}
            canSendKitchen={!p.isDraftOrder && p.canSendKitchen}
            billingPending={p.billMutation.isPending}
            paying={p.payMutation.isPending}
            sendingKitchen={p.sendKitchenMutation.isPending}
            servicePreview={p.isDraftOrder ? null : p.servicePreview}
            onOpenFull={() => setFullOrder(true)}
            onSendKitchen={p.isDraftOrder ? undefined : () => p.sendKitchenMutation.mutate()}
            onRequestBill={p.isDraftOrder ? undefined : () => p.billMutation.mutate()}
            onPay={p.isDraftOrder ? undefined : p.openPayModal}
            onRemove={p.isDraftOrder ? undefined : p.handleRemoveItem}
            onQty={p.isDraftOrder ? undefined : p.handleQty}
            allowKitchenRefuse={!p.isDraftOrder && !!p.access?.canCancelOrder}
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

  if (tab === 'paid') {
    return <CashierPaidPanel p={p} />;
  }

  if (tab === 'orders') {
    return (
      <div className="rst-cashier-panel">
        <h2 className="rst-floor-hall-rail__title">{p.t('rst.cashier.tabOrders')}</h2>
        <CashierOrdersList
          tables={p.hallTables}
          halls={p.halls}
          waiterNameById={p.waiterNameById}
          onSelect={p.selectTableCheck}
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
        <h2 className="rst-floor-hall-rail__title">{p.t('rst.cashier.tabPayment')}</h2>
        <CashierOrdersList
          tables={p.hallTables}
          halls={p.halls}
          onlyWaitingPayment
          waiterNameById={p.waiterNameById}
          onSelect={p.selectTableCheck}
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
