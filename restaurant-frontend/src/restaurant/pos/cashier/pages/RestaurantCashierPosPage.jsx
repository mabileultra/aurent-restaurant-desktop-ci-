import { useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import RestaurantWorkspaceEmpty from '../../../shared/components/RestaurantWorkspaceEmpty';
import { logoutAndResetSession } from '../../../../utils/authSession';
import FloorPosModals from '../../components/FloorPosModals';
import OrderWorkspace from '../../components/OrderWorkspace';
import OrderDiscountModal from '../../components/OrderDiscountModal';
import CashDrawerModal from '../../components/shift/CashDrawerModal';
import PosHardwareBar from '../../components/PosHardwareBar';
import { usePosUiScale } from '../../hooks/usePosUiScale';
import { useCashierPosPage } from '../hooks/useCashierPosPage';
import CashierTopBar from '../components/CashierTopBar';
import CashierSectionBody from '../components/CashierSectionBody';
import '../../../shared/styles/restaurant-tokens.css';
import '../../../shared/styles/rst-blocks.css';
import '../../styles/floor-pos.css';
import '../../styles/floor-section-tabs.css';
import '../../styles/floor-pos-touch.css';
import '../../styles/floor-pos-controls.css';
import '../../styles/counter-board.css';
import '../styles/cashier-shell.css';

export default function RestaurantCashierPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useCashierPosPage();
  const zoom = usePosUiScale();

  const exitFullOrder = () => {
    if (p.isDraftOrder) {
      p.clearOrder();
      return;
    }
    p.setFullOrder(false);
  };

  const [discountOpen, setDiscountOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const discountOrder = !p.isDraftOrder ? p.orderForUi : null;
  const canDiscount = Boolean(
    discountOrder && (discountOrder.status === 'OPEN' || discountOrder.status === 'BILLING'),
  );

  const handleTab = (next) => {
    if (next === 'shift') {
      p.setShiftModal(true);
      return;
    }
    if (next === 'discount') {
      if (canDiscount) setDiscountOpen(true);
      return;
    }
    if (next === 'cash') {
      if (p.shift?.id) setCashOpen(true);
      return;
    }
    p.setTab(next);
  };

  if (p.workspace.isLoading && p.workspace.storeId == null) {
    return (
      <div className="rst-app rst-cashier" style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('common.loading')}</div>
      </div>
    );
  }

  if (p.workspace.noAssignment || p.workspace.multipleAssignment) {
    return (
      <RestaurantWorkspaceEmpty
        t={p.t}
        workspace={p.workspace}
        zoomStyle={zoom.rootStyle}
        onLogout={() => logoutAndResetSession()}
      />
    );
  }

  const showFull = p.showFullOrder;
  const order = p.orderForUi;
  const hallName = p.isDraftOrder ? p.draftHallName : p.orderHallName;

  return (
    <div className="rst-app rst-cashier" style={zoom.rootStyle}>
      <CashierTopBar
        storeName={p.workspace.storeName}
        userLabel={user?.fullName || user?.username}
        canAdmin={p.canAdmin}
        activeTab={p.tab}
        onSelectTab={handleTab}
        disabledTabs={[
          ...(canDiscount ? [] : ['discount']),
          ...(p.shift?.id ? [] : ['cash']),
        ]}
        backToCashier={showFull ? {
          label: p.t('rst.cashier.backToCashier'),
          onClick: exitFullOrder,
        } : null}
        t={p.t}
      />

      <div className="rst-cashier__body">
        {showFull && order ? (
          <div className="rst-cashier-full">
            <OrderWorkspace
              order={order}
              menuItems={p.menuItems}
              onBack={exitFullOrder}
              backLabel={p.t('rst.cashier.backToCashier')}
              hideBack
              hallName={hallName}
              waiterName={
                order.waiterUserId
                  ? p.waiterNameById.get(String(order.waiterUserId))
                  : null
              }
              onAddItem={p.handleAddItem}
              onComposeFamily={p.handleComposeFamily}
              onQty={p.isDraftOrder ? undefined : p.handleQty}
              onRemove={p.isDraftOrder ? undefined : (itemId) => p.removeItemMutation.mutate(itemId)}
              onCancel={p.isDraftOrder ? undefined : () => {
                if (window.confirm(p.t('rst.order.confirmCancel'))) {
                  p.cancelMutation.mutate();
                }
              }}
              canCancel={!p.isDraftOrder && p.canCancel}
              allowKitchenRefuse={!p.isDraftOrder && !!p.access?.canCancelOrder}
              canSendKitchen={!p.isDraftOrder && p.canSendKitchen}
              sendingKitchen={p.sendKitchenMutation.isPending}
              onSendKitchen={p.isDraftOrder ? undefined : () => p.sendKitchenMutation.mutate()}
              canRequestBill={!p.isDraftOrder && p.canRequestBill}
              canPay={!p.isDraftOrder && p.canPay}
              onRequestBill={p.isDraftOrder ? undefined : () => p.billMutation.mutate()}
              onPay={p.isDraftOrder ? undefined : p.openPayModal}
              onDiscount={p.isDraftOrder ? undefined : (amount) => p.discountMutation.mutate(amount)}
              discountPending={p.discountMutation.isPending}
              onGuestsChange={p.isDraftOrder ? undefined : (payload) => p.updateGuestsMutation.mutate(payload)}
              guestsPending={p.updateGuestsMutation.isPending}
              billingPending={p.billMutation.isPending}
              paying={p.payMutation.isPending}
              onNewCheck={
                !p.isDraftOrder && p.access?.canOpenOrder && p.order?.tableId && !p.openExtraCheckPending
                  ? () => {
                    const table = (p.halls || []).flatMap((hall) => hall.tables || [])
                      .find((row) => row.id === p.order.tableId)
                      || { id: p.order.tableId };
                    p.openExtraCheck(table, {
                      guestCount: p.order.guestCount,
                      waiterUserId: p.order.waiterUserId,
                    });
                  }
                  : undefined
              }
              servicePreview={p.isDraftOrder ? null : p.servicePreview}
              waiters={!p.isDraftOrder && p.access.canAssignWaiter ? p.waiters : []}
              onAssignWaiter={
                !p.isDraftOrder && p.access.canAssignWaiter
                  ? (waiterUserId) => p.assignWaiterMutation.mutate(waiterUserId)
                  : undefined
              }
              assigningWaiter={p.assignWaiterMutation.isPending}
              onEditNote={p.isDraftOrder ? undefined : p.openLineNote}
              t={p.t}
            />
          </div>
        ) : (
          <CashierSectionBody p={p} fullOrder={p.fullOrder} setFullOrder={p.setFullOrder} />
        )}
      </div>

      {showFull ? null : <PosHardwareBar t={p.t} />}
      <FloorPosModals p={p} />
      <OrderDiscountModal
        open={discountOpen && canDiscount}
        subtotal={discountOrder?.subtotal}
        currentDiscount={Number(discountOrder?.discountAmount) || 0}
        saving={p.discountMutation.isPending}
        onClose={() => setDiscountOpen(false)}
        onSubmit={(amount) => {
          p.discountMutation.mutate(amount);
          setDiscountOpen(false);
        }}
        t={p.t}
      />
      <CashDrawerModal
        open={cashOpen && Boolean(p.shift?.id)}
        onClose={() => setCashOpen(false)}
        shift={p.shift}
        t={p.t}
      />
    </div>
  );
}
