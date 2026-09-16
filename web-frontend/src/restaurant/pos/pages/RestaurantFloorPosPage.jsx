import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import FloorTableGrid from '../components/FloorTableGrid';
import OpenTableModal from '../components/OpenTableModal';
import OpenCounterOrderModal from '../components/OpenCounterOrderModal';
import CounterOrdersBoard from '../components/CounterOrdersBoard';
import ModifierPickModal from '../components/ModifierPickModal';
import OrderWorkspace from '../components/OrderWorkspace';
import RestaurantReceiptModal from '../components/RestaurantReceiptModal';
import ShiftModal from '../components/ShiftModal';
import PosZoomControls from '../components/PosZoomControls';
import PosHardwareBar from '../components/PosHardwareBar';
import { useFloorPosPage } from '../hooks/useFloorPosPage';
import { usePosUiScale } from '../hooks/usePosUiScale';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/shift-bar.css';
import '../styles/counter-board.css';

export default function RestaurantFloorPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useFloorPosPage();
  const zoom = usePosUiScale();

  if (p.workspace.noAssignment) {
    return (
      <div className="rst-app rst-pos" style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('rst.floor.noStore')}</div>
      </div>
    );
  }

  if (p.workspace.multipleAssignment) {
    return (
      <div className="rst-app rst-pos" style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('rst.floor.pickStoreHint')}</div>
      </div>
    );
  }

  return (
    <div className="rst-app rst-pos" style={zoom.rootStyle}>
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.brand')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {p.shift ? ` · ${p.t('rst.shift.shiftShort', { id: String(p.shift.id).slice(0, 4) })}` : ''}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
          </span>
        </div>
        <div className="rst-pos__modes">
          <button
            type="button"
            className={`rst-pos__mode${p.posMode === 'floor' ? ' is-active' : ''}`}
            onClick={() => p.changePosMode('floor')}
          >
            {p.t('rst.pos.floor')}
          </button>
          <button
            type="button"
            className={`rst-pos__mode${p.posMode === 'takeaway' ? ' is-active' : ''}`}
            onClick={() => p.changePosMode('takeaway')}
          >
            {p.t('rst.pos.takeaway')}
          </button>
          <button
            type="button"
            className={`rst-pos__mode${p.posMode === 'delivery' ? ' is-active' : ''}`}
            onClick={() => p.changePosMode('delivery')}
          >
            {p.t('rst.pos.delivery')}
          </button>
        </div>
        <div className="rst-pos__actions">
          {p.canAdmin ? (
            <>
              <Link to="/rst/kitchen">
                <BaseButton type="button" variant="ghost">{p.t('rst.pos.toKitchen')}</BaseButton>
              </Link>
              <Link to="/rst/admin/halls">
                <BaseButton type="button" variant="ghost">{p.t('rst.pos.toAdmin')}</BaseButton>
              </Link>
            </>
          ) : null}
          <PosZoomControls zoom={zoom} t={p.t} />
          <span className="rst-pos__online">
            <span className="rst-pos__online-dot" aria-hidden />
            ONLINE
          </span>
          <BaseButton
            type="button"
            variant="ghost"
            className="rst-pos__exit"
            onClick={() => logoutAndResetSession()}
          >
            {p.t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      <div className="rst-pos__body">
        {!p.activeOrderId ? (
          <div className={`rst-shift-bar${p.shift ? '' : ' is-closed'}`}>
            <div className="rst-shift-bar__meta">
              {p.shift ? (
                <>
                  <span>
                    {p.t('rst.shift.openLabel')}
                    {p.shiftOpenLabel ? `: ${p.shiftOpenLabel}` : ''}
                  </span>
                  <span>{p.t('rst.shift.sales')}: <strong>{p.shift.saleCount}</strong></span>
                  <span>{p.t('rst.shift.total')}: <strong>{fmtMoneyCompact(p.shift.totalAmount)}</strong></span>
                  <span>{p.t('rst.shift.card')}: <strong>{fmtMoneyCompact(p.shift.cardAmount)}</strong></span>
                  <span>{p.t('rst.shift.cash')}: <strong>{fmtMoneyCompact(p.shift.cashAmount)}</strong></span>
                </>
              ) : (
                <span>{p.t('rst.shift.closedLabel')}</span>
              )}
            </div>
            <div className="rst-shift-bar__actions">
              {p.shift ? (
                <BaseButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    p.setClosingCash(String(p.shift.openingCash ?? 0));
                    p.setShiftModal('close');
                  }}
                >
                  {p.t('rst.shift.close')}
                </BaseButton>
              ) : (
                <BaseButton
                  type="button"
                  onClick={() => {
                    p.setOpeningCash('0');
                    p.setShiftModal('open');
                  }}
                >
                  {p.t('rst.shift.open')}
                </BaseButton>
              )}
            </div>
          </div>
        ) : null}

        {p.activeOrderId ? (
          p.order ? (
            <OrderWorkspace
              order={p.order}
              menuItems={p.menuItems}
              onBack={() => p.setActiveOrderId(null)}
              backLabel={p.t(p.backLabelKey)}
              hallName={p.orderHallName}
              waiterName={
                p.order.waiterUserId
                  ? p.waiterNameById.get(String(p.order.waiterUserId))
                  : null
              }
              onAddItem={p.handleAddItem}
              onQty={p.handleQty}
              onRemove={(itemId) => p.removeItemMutation.mutate(itemId)}
              onCancel={() => {
                if (window.confirm(p.t('rst.order.confirmCancel'))) {
                  p.cancelMutation.mutate();
                }
              }}
              canCancel={p.canCancel}
              canSendKitchen={p.canSendKitchen}
              sendingKitchen={p.sendKitchenMutation.isPending}
              onSendKitchen={() => p.sendKitchenMutation.mutate()}
              canRequestBill={p.canRequestBill}
              canPay={p.canPay}
              onRequestBill={() => p.billMutation.mutate()}
              onPay={(method, amount) => {
                if (window.confirm(p.t('rst.order.confirmPay', { amount }))) {
                  p.payMutation.mutate({ method, amount });
                }
              }}
              onGuestsChange={(guestCount) => p.updateGuestsMutation.mutate(guestCount)}
              guestsPending={p.updateGuestsMutation.isPending}
              billingPending={p.billMutation.isPending}
              paying={p.payMutation.isPending}
              printReceiptEnabled={p.printReceiptEnabled}
              onPrintReceiptChange={p.setPrintReceiptEnabled}
              commissionPreview={p.commissionPreview}
              waiters={p.waiters}
              onAssignWaiter={(waiterUserId) => p.assignWaiterMutation.mutate(waiterUserId)}
              assigningWaiter={p.assignWaiterMutation.isPending}
              t={p.t}
            />
          ) : (
            <div className="rst-notice">{p.t('common.loading')}</div>
          )
        ) : p.posMode === 'floor' ? (
          <>
            {p.isError ? <div className="rst-notice">{p.t('rst.floor.loadFailed')}</div> : null}
            <FloorTableGrid
              hall={p.selectedHall}
              halls={p.halls}
              selectedHallId={p.selectedHall?.id}
              onSelectHall={p.setSelectedHallId}
              selectedTableId={p.openTable?.id}
              onTableClick={p.handleTableClick}
              search={p.floorSearch}
              onSearchChange={p.setFloorSearch}
              onNewOrder={p.handleFloorNewOrder}
              waiterNameById={p.waiterNameById}
              t={p.t}
            />
          </>
        ) : (
          <>
            {p.isError ? <div className="rst-notice">{p.t('rst.pos.counterLoadFailed')}</div> : null}
            <CounterOrdersBoard
              channel={p.channel}
              orders={p.counterOrders}
              loading={p.counterLoading}
              onOpenNew={p.handleOpenCounter}
              onSelect={p.setActiveOrderId}
              t={p.t}
            />
          </>
        )}
      </div>

      <PosHardwareBar t={p.t} />

      <OpenTableModal
        open={!!p.openTable}
        table={p.openTable}
        form={p.guestForm}
        onChange={p.setGuestForm}
        onClose={() => p.setOpenTable(null)}
        onSubmit={() => p.openMutation.mutate()}
        isPending={p.openMutation.isPending}
        t={p.t}
      />
      <OpenCounterOrderModal
        open={p.counterModalOpen}
        channel={p.channel}
        form={p.counterForm}
        onChange={p.setCounterForm}
        onClose={() => p.setCounterModalOpen(false)}
        onSubmit={() => p.openCounterMutation.mutate()}
        isPending={p.openCounterMutation.isPending}
        t={p.t}
      />
      <ModifierPickModal
        item={p.pendingMenuItem}
        groups={p.modifierGroups}
        selectedIds={p.selectedModifierIds}
        onToggle={p.toggleModifier}
        onClose={p.closeModifiers}
        onConfirm={p.confirmModifiers}
        t={p.t}
      />
      <ShiftModal
        mode={p.shiftModal}
        openingCash={p.openingCash}
        closingCash={p.closingCash}
        onOpeningCash={p.setOpeningCash}
        onClosingCash={p.setClosingCash}
        onClose={() => p.setShiftModal(null)}
        onSubmit={() => (p.shiftModal === 'open' ? p.openShiftMutation.mutate() : p.closeShiftMutation.mutate())}
        isPending={p.openShiftMutation.isPending || p.closeShiftMutation.isPending}
        t={p.t}
      />
      {p.paidReceipt?.sale ? (
        <RestaurantReceiptModal
          sale={p.paidReceipt.sale}
          autoPrint={Boolean(p.paidReceipt.autoPrint)}
          onClose={p.closePaidReceipt}
          onRefund={(orderId) => p.refundMutation.mutate(orderId)}
          refunding={p.refundMutation.isPending}
          t={p.t}
        />
      ) : null}
    </div>
  );
}
