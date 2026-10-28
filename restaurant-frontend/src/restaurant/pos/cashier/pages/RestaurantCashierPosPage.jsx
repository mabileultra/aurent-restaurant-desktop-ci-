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
import { useCashierMobileLayout } from '../../cashier-mobile/hooks/useCashierMobileLayout';
import CashierMobileOrderWorkspace from '../../cashier-mobile/components/CashierMobileOrderWorkspace';
import CashierMobileNavSheet from '../../cashier-mobile/components/CashierMobileNavSheet';
import '../../../shared/styles/restaurant-tokens.css';
import '../../../shared/styles/rst-blocks.css';
import '../../styles/floor-pos.css';
import '../../styles/floor-section-tabs.css';
import '../../styles/floor-pos-touch.css';
import '../../styles/floor-pos-controls.css';
import '../../styles/counter-board.css';
import '../styles/cashier-shell.css';
import '../styles/cashier-bottom-nav.css';
import '../../cashier-mobile/styles/cashier-mobile-shell.css';

export default function RestaurantCashierPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useCashierPosPage();
  const zoom = usePosUiScale();
  const mobile = useCashierMobileLayout();

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
    const loadingClass = [
      'rst-app rst-cashier',
      mobile.enabled ? 'rst-cashier--mobile' : '',
    ].filter(Boolean).join(' ');
    return (
      <div className={loadingClass} style={zoom.rootStyle}>
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
  const rootClass = [
    'rst-app rst-cashier',
    mobile.enabled ? 'rst-cashier--mobile' : '',
    mobile.enabled && showFull ? 'rst-cashier--order-open' : '',
  ].filter(Boolean).join(' ');

  const mobileOrderOpen = mobile.enabled && showFull;

  const orderCommon = order ? {
    order,
    menuItems: p.menuItems,
    onBack: exitFullOrder,
    hallName,
    waiterName: order.waiterUserId
      ? p.waiterNameById.get(String(order.waiterUserId))
      : null,
    onAddItem: p.handleAddItem,
    onComposeFamily: p.handleComposeFamily,
    onQty: p.isDraftOrder ? undefined : p.handleQty,
    onRemove: p.isDraftOrder ? undefined : p.handleRemoveItem,
    onCancel: p.isDraftOrder ? undefined : () => p.cancelMutation.mutate(),
    canCancel: !p.isDraftOrder && p.canCancel,
    canSendKitchen: !p.isDraftOrder && p.canSendKitchen,
    sendingKitchen: p.sendKitchenMutation.isPending,
    onSendKitchen: p.isDraftOrder ? undefined : () => p.sendKitchenMutation.mutate(),
    canReprintPickup: !p.isDraftOrder && p.canReprintPickup && !!order.pickupNo,
    reprintingPickup: p.reprintPickupMutation?.isPending,
    onReprintPickup: p.isDraftOrder ? undefined : () => p.reprintPickupMutation?.mutate(),
    canRequestBill: !p.isDraftOrder && p.canRequestBill,
    canPay: !p.isDraftOrder && p.canPay,
    onRequestBill: p.isDraftOrder ? undefined : () => p.billMutation.mutate(),
    onPay: p.isDraftOrder ? undefined : p.openPayModal,
    onDiscount: p.isDraftOrder ? undefined : (amount) => p.discountMutation.mutate(amount),
    discountPending: p.discountMutation.isPending,
    onGuestsChange: p.isDraftOrder ? undefined : (payload) => p.updateGuestsMutation.mutate(payload),
    guestsPending: p.updateGuestsMutation.isPending,
    billingPending: p.billMutation.isPending,
    paying: p.payMutation.isPending,
    onNewCheck: (
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
    ),
    servicePreview: p.isDraftOrder ? null : p.servicePreview,
    waiters: !p.isDraftOrder && p.access.canAssignWaiter ? p.waiters : [],
    onAssignWaiter: (
      !p.isDraftOrder && p.access.canAssignWaiter
        ? (waiterUserId) => p.assignWaiterMutation.mutate(waiterUserId)
        : undefined
    ),
    assigningWaiter: p.assignWaiterMutation.isPending,
    onEditNote: p.isDraftOrder ? undefined : p.openLineNote,
    t: p.t,
  } : null;

  return (
    <div className={rootClass} style={zoom.rootStyle}>
      {mobileOrderOpen ? null : (
        <CashierTopBar
          storeName={p.workspace.storeName}
          userLabel={user?.fullName || user?.username}
          canAdmin={p.canAdmin}
          backToCashier={showFull ? {
            label: p.t('rst.cashier.backToCashier'),
            onClick: exitFullOrder,
          } : null}
          activeTab={p.tab}
          onSelectTab={handleTab}
          disabledTabs={[
            ...(canDiscount ? [] : ['discount']),
            ...(p.shift?.id ? [] : ['cash']),
          ]}
          showEnterMobile={mobile.showEnterMobile}
          onEnterMobile={mobile.enterMobile}
          showExitMobile={mobile.showExitMobile}
          onExitMobile={mobile.exitMobile}
          compactActions={mobile.enabled}
          showMenuSearch={showFull && !mobile.enabled}
          roleLabel={p.t(`roles.${user?.role || 'CASHIER'}`, { defaultValue: p.t('roles.CASHIER') })}
          shift={p.shift}
          shiftOpenLabel={p.shiftOpenLabel}
          storeId={p.workspace.storeId}
          quickSaleEnabled={p.quickSaleEnabled}
          onQuickSaleOpened={p.onQuickSaleOpened}
          t={p.t}
        />
      )}

      <div className="rst-cashier__body">
        {showFull && orderCommon ? (
          <div className="rst-cashier-full">
            {mobileOrderOpen ? (
              <CashierMobileOrderWorkspace {...orderCommon} />
            ) : (
              <OrderWorkspace
                {...orderCommon}
                backLabel={p.t('rst.cashier.backToCashier')}
                hideBack
                allowKitchenRefuse={!p.isDraftOrder && !!p.access?.canCancelOrder}
                linePriceMode="total"
              />
            )}
          </div>
        ) : (
          <CashierSectionBody p={p} fullOrder={p.fullOrder} setFullOrder={p.setFullOrder} />
        )}
      </div>

      {showFull || mobile.enabled ? null : (
        <PosHardwareBar t={p.t} halls={p.halls} shift={p.shift} />
      )}
      {mobile.enabled && !showFull ? (
        <CashierMobileNavSheet
          tab={p.tab}
          onSelect={handleTab}
          disabledKeys={[
            ...(canDiscount ? [] : ['discount']),
            ...(p.shift?.id ? [] : ['cash']),
          ]}
          t={p.t}
        />
      ) : null}
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
