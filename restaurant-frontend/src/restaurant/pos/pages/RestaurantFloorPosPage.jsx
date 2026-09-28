import { LayoutGrid, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import RestaurantWorkspaceEmpty from '../../shared/components/RestaurantWorkspaceEmpty';
import BookingWorkspace from '../../shared/components/BookingWorkspace';
import FloorTableGrid from '../components/FloorTableGrid';
import FloorPosModals from '../components/FloorPosModals';
import OrderWorkspace from '../components/OrderWorkspace';
import PosZoomControls from '../components/PosZoomControls';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../shared/components/RestaurantThemeSwitch';
import { useFloorPosPage } from '../hooks/useFloorPosPage';
import { usePosUiScale } from '../hooks/usePosUiScale';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/floor-section-tabs.css';
import '../styles/floor-pos-touch.css';
import '../styles/floor-pos-controls.css';
import '../styles/shift-bar.css';

/** Compact shift status for waiter — no cash totals / close. */
function WaiterShiftHint({ p }) {
  if (p.shift) {
    return (
      <div className="rst-shift-bar">
        <div className="rst-shift-bar__meta">
          <span>
            {p.t('rst.shift.openLabel')}
            {p.shiftOpenLabel ? `: ${p.shiftOpenLabel}` : ''}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rst-shift-bar is-closed">
      <div className="rst-shift-bar__meta">
        <span>{p.t('rst.shift.closedLabel')}</span>
      </div>
      <div className="rst-shift-bar__actions">
        <BaseButton
          type="button"
          onClick={() => p.setShiftModal(true)}
        >
          {p.t('rst.shift.open')}
        </BaseButton>
      </div>
    </div>
  );
}

function FloorSectionSwitch({ p }) {
  if (!p.access.canViewBooking) return null;
  return (
    <div className="rst-floor-section-tabs rst-floor-section-tabs--toolbar" role="tablist" aria-label={p.t('rst.pos.tables')}>
      <button
        type="button"
        role="tab"
        aria-selected={p.floorSection === 'tables'}
        className={`rst-floor-section-tabs__btn${p.floorSection === 'tables' ? ' is-active' : ''}`}
        onClick={() => p.setFloorSection('tables')}
      >
        <LayoutGrid size={15} aria-hidden />
        {p.t('rst.pos.tables')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={p.floorSection === 'bookings'}
        className={`rst-floor-section-tabs__btn${p.floorSection === 'bookings' ? ' is-active' : ''}`}
        onClick={() => p.setFloorSection('bookings')}
      >
        <CalendarDays size={15} aria-hidden />
        {p.t('rst.pos.bookings')}
      </button>
    </div>
  );
}

function FloorBody({ p, a }) {
  if (p.floorSection === 'bookings') {
    return (
      <>
        <FloorSectionSwitch p={p} />
        <BookingWorkspace
          compact
          access={{
            canCreate: p.access.canCreateBooking,
            canManage: p.access.canManageBooking,
          }}
        />
      </>
    );
  }

  return (
    <>
      {p.isError ? <div className="rst-notice">{p.t('rst.floor.loadFailed')}</div> : null}
      <FloorTableGrid
        hallTables={p.hallTables}
        halls={p.halls}
        selectedHallId={p.selectedHallId}
        onSelectHall={p.setSelectedHallId}
        statusFilter={p.statusFilter}
        onStatusFilter={p.setStatusFilter}
        selectedTableId={p.openTable?.id ?? p.reservedTable?.id ?? a.inspectTable?.id}
        onTableClick={p.handleTableClick}
        search={p.floorSearch}
        onSearchChange={p.setFloorSearch}
        sectionSwitch={<FloorSectionSwitch p={p} />}
        waiterNameById={p.waiterNameById}
        t={p.t}
      />
    </>
  );
}

/**
 * Waiter floor POS only — tables, bookings, order compose, bill/print.
 * No counter sales, payment, returns, hardware strip, or cashier shift cash.
 */
export default function RestaurantFloorPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useFloorPosPage();
  const zoom = usePosUiScale();
  const a = p.tableActions;

  if (p.workspace.isLoading) {
    return (
      <div className="rst-app rst-pos" style={zoom.rootStyle}>
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

  return (
    <div className="rst-app rst-pos" style={zoom.rootStyle}>
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.waiter.title')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
          </span>
        </div>
        <WaiterShiftHint p={p} />
        <div className="rst-pos__actions">
          <PosZoomControls zoom={zoom} t={p.t} />
          <RestaurantThemeSwitch />
          <LanguageSwitcher variant="rst" />
          <BaseButton
            type="button"
            variant="ghost"
            className="rst-exit-btn"
            onClick={() => logoutAndResetSession()}
          >
            {p.t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      <div className="rst-pos__body">
        {p.activeOrderId ? (
          p.order ? (
            <OrderWorkspace
              order={p.order}
              menuItems={p.menuItems}
              onBack={() => p.setActiveOrderId(null)}
              backLabel={p.t('rst.order.backToFloor')}
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
              canSendKitchen={p.canSendKitchen}
              sendingKitchen={p.sendKitchenMutation.isPending}
              onSendKitchen={() => p.sendKitchenMutation.mutate()}
              canRequestBill={p.canRequestBill}
              canPay={false}
              onRequestBill={() => p.billMutation.mutate()}
              onPay={undefined}
              onDiscount={(amount) => p.discountMutation.mutate(amount)}
              discountPending={p.discountMutation.isPending}
              onGuestsChange={(payload) => p.updateGuestsMutation.mutate(payload)}
              guestsPending={p.updateGuestsMutation.isPending}
              billingPending={p.billMutation.isPending}
              paying={false}
              commissionPreview={p.commissionPreview}
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
          ) : (
            <div className="rst-notice">{p.t('common.loading')}</div>
          )
        ) : (
          <FloorBody p={p} a={a} />
        )}
      </div>

      <FloorPosModals p={p} waiterMode />
    </div>
  );
}
