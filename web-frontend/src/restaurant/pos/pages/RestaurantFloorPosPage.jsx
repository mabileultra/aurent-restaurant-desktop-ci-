import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import FloorHallTabs from '../components/FloorHallTabs';
import FloorCanvas from '../components/FloorCanvas';
import FloorStatusLegend from '../components/FloorStatusLegend';
import OpenTableModal from '../components/OpenTableModal';
import ModifierPickModal from '../components/ModifierPickModal';
import OrderWorkspace from '../components/OrderWorkspace';
import ShiftModal from '../components/ShiftModal';
import { useFloorPosPage } from '../hooks/useFloorPosPage';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/shift-bar.css';

export default function RestaurantFloorPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useFloorPosPage();

  if (p.workspace.noAssignment) {
    return (
      <div className="rst-app rst-pos">
        <div className="rst-notice">{p.t('rst.floor.noStore')}</div>
      </div>
    );
  }

  if (p.workspace.multipleAssignment) {
    return (
      <div className="rst-app rst-pos">
        <div className="rst-notice">{p.t('rst.floor.pickStoreHint')}</div>
      </div>
    );
  }

  return (
    <div className="rst-app rst-pos">
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.brand')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
          </span>
        </div>
        <div className="rst-pos__modes">
          <span className="rst-pos__mode is-active">{p.t('rst.pos.floor')}</span>
          <button type="button" className="rst-pos__mode" disabled>
            {p.t('rst.pos.takeaway')}
          </button>
          <button type="button" className="rst-pos__mode" disabled>
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
          <BaseButton type="button" variant="ghost" onClick={() => logoutAndResetSession()}>
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
                  <span>{p.t('rst.shift.openLabel')}</span>
                  <span>{p.t('rst.shift.sales')}: <strong>{p.shift.saleCount}</strong></span>
                  <span>{p.t('rst.shift.total')}: <strong>{fmtMoneyCompact(p.shift.totalAmount)}</strong></span>
                  <span>{p.t('rst.shift.cash')}: <strong>{fmtMoneyCompact(p.shift.cashAmount)}</strong></span>
                  <span>{p.t('rst.shift.card')}: <strong>{fmtMoneyCompact(p.shift.cardAmount)}</strong></span>
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
            onPay={(method) => {
              if (window.confirm(p.t('rst.order.confirmPay', { amount: p.order.subtotal }))) {
                p.payMutation.mutate(method);
              }
            }}
            billingPending={p.billMutation.isPending}
            paying={p.payMutation.isPending}
            t={p.t}
          />
          ) : (
            <div className="rst-notice">{p.t('common.loading')}</div>
          )
        ) : (
          <>
            {p.isError ? <div className="rst-notice">{p.t('rst.floor.loadFailed')}</div> : null}
            {p.halls.length > 0 ? (
              <FloorHallTabs
                halls={p.halls}
                selectedHallId={p.selectedHallId}
                onSelect={p.setSelectedHallId}
              />
            ) : null}
            <FloorCanvas
              hall={p.selectedHall}
              selectedTableId={p.openTable?.id}
              onTableClick={p.handleTableClick}
              t={p.t}
            />
            <FloorStatusLegend t={p.t} />
          </>
        )}
      </div>

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
    </div>
  );
}
