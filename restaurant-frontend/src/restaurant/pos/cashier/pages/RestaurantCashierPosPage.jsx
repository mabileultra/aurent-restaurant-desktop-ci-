import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import RestaurantWorkspaceEmpty from '../../../shared/components/RestaurantWorkspaceEmpty';
import { logoutAndResetSession } from '../../../../utils/authSession';
import FloorPosModals from '../../components/FloorPosModals';
import OrderWorkspace from '../../components/OrderWorkspace';
import PosHardwareBar from '../../components/PosHardwareBar';
import { usePosUiScale } from '../../hooks/usePosUiScale';
import { useCashierPosPage } from '../hooks/useCashierPosPage';
import CashierTopBar from '../components/CashierTopBar';
import CashierBottomNav from '../components/CashierBottomNav';
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
  const [fullOrder, setFullOrder] = useState(false);

  useEffect(() => {
    if (!p.activeOrderId) setFullOrder(false);
  }, [p.activeOrderId]);

  const exitFullOrder = () => setFullOrder(false);

  const handleTab = (next) => {
    if (next === 'shift') {
      p.setShiftModal(true);
      return;
    }
    setFullOrder(false);
    p.setTab(next);
  };

  if (p.workspace.isLoading) {
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

  const showFull = fullOrder && p.activeOrderId && p.order;

  return (
    <div className="rst-app rst-cashier" style={zoom.rootStyle}>
      <CashierTopBar
        storeName={p.workspace.storeName}
        shift={p.shift}
        shiftOpenLabel={p.shiftOpenLabel}
        zoom={zoom}
        userLabel={user?.fullName || user?.username}
        canAdmin={p.canAdmin}
        backToCashier={showFull ? {
          label: p.t('rst.cashier.backToCashier'),
          onClick: exitFullOrder,
        } : null}
        t={p.t}
      />

      <div className="rst-cashier__body">
        {showFull ? (
          <div className="rst-cashier-full">
            <OrderWorkspace
              order={p.order}
              menuItems={p.menuItems}
              onBack={exitFullOrder}
              backLabel={p.t('rst.cashier.backToCashier')}
              hideBack
              hallName={p.orderHallName}
              waiterName={
                p.order.waiterUserId
                  ? p.waiterNameById.get(String(p.order.waiterUserId))
                  : null
              }
              onAddItem={p.handleAddItem}
              onComposeFamily={p.handleComposeFamily}
              onQty={p.handleQty}
              onRemove={(itemId) => p.removeItemMutation.mutate(itemId)}
              onCancel={() => {
                if (window.confirm(p.t('rst.order.confirmCancel'))) {
                  p.cancelMutation.mutate();
                }
              }}
              canCancel={p.canCancel}
              allowKitchenRefuse={!!p.access?.canCancelOrder}
              canSendKitchen={p.canSendKitchen}
              sendingKitchen={p.sendKitchenMutation.isPending}
              onSendKitchen={() => p.sendKitchenMutation.mutate()}
              canRequestBill={p.canRequestBill}
              canPay={p.canPay}
              onRequestBill={() => p.billMutation.mutate()}
              onPay={p.openPayModal}
              onDiscount={(amount) => p.discountMutation.mutate(amount)}
              discountPending={p.discountMutation.isPending}
              onGuestsChange={(payload) => p.updateGuestsMutation.mutate(payload)}
              guestsPending={p.updateGuestsMutation.isPending}
              billingPending={p.billMutation.isPending}
              paying={p.payMutation.isPending}
              onNewCheck={p.access?.canOpenOrder && p.order?.tableId && !p.openExtraCheckPending ? () => {
                const table = (p.halls || []).flatMap((hall) => hall.tables || [])
                  .find((row) => row.id === p.order.tableId)
                  || { id: p.order.tableId };
                p.openExtraCheck(table, {
                  guestCount: p.order.guestCount,
                  waiterUserId: p.order.waiterUserId,
                });
              } : undefined}
              servicePreview={p.servicePreview}
              waiters={p.access.canAssignWaiter ? p.waiters : []}
              onAssignWaiter={
                p.access.canAssignWaiter
                  ? (waiterUserId) => p.assignWaiterMutation.mutate(waiterUserId)
                  : undefined
              }
              assigningWaiter={p.assignWaiterMutation.isPending}
              onEditNote={p.openLineNote}
              t={p.t}
            />
          </div>
        ) : (
          <CashierSectionBody p={p} fullOrder={fullOrder} setFullOrder={setFullOrder} />
        )}
      </div>

      {showFull ? null : <CashierBottomNav tab={p.tab} onSelect={handleTab} t={p.t} />}
      {showFull ? null : <PosHardwareBar t={p.t} />}
      <FloorPosModals p={p} />
    </div>
  );
}
