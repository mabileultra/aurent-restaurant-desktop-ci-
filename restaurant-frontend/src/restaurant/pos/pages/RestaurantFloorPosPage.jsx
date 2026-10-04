import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import RestaurantWorkspaceEmpty from '../../shared/components/RestaurantWorkspaceEmpty';
import BookingWorkspace from '../../shared/components/BookingWorkspace';
import FloorTableGrid from '../components/FloorTableGrid';
import FloorPosModals from '../components/FloorPosModals';
import OrderWorkspace from '../components/OrderWorkspace';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../shared/components/RestaurantThemeSwitch';
import { useFloorPosPage } from '../hooks/useFloorPosPage';
import { useWaiterMobileLayout } from '../waiter-mobile/hooks/useWaiterMobileLayout';
import WaiterMobileHeaderActions from '../waiter-mobile/components/WaiterMobileHeaderActions';
import WaiterMobileFloorBoard from '../waiter-mobile/components/WaiterMobileFloorBoard';
import WaiterMobileOrderWorkspace from '../waiter-mobile/components/WaiterMobileOrderWorkspace';
import WaiterMobileBookingBoard from '../waiter-mobile/components/WaiterMobileBookingBoard';
import WaiterEnterMobileButton from '../waiter-mobile/components/WaiterEnterMobileButton';
import CashierNavLookup from '../cashier/components/CashierNavLookup';
import { usesCashierPos } from '../cashier/utils/cashierNav';
import {
  ALL_HALLS_ID,
  filterTablesByStatus,
  filterTablesByWaiter,
  tableActiveOrders,
} from '../utils/floorStatusFilters';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/floor-section-tabs.css';
import '../styles/floor-table-grid.css';
import '../styles/floor-pos-touch.css';
import '../styles/floor-pos-controls.css';
import '../styles/shift-bar.css';
import '../waiter-mobile/styles/waiter-mobile-floor.css';
import '../waiter-mobile/styles/waiter-mobile-order.css';
import '../waiter-mobile/styles/waiter-mobile-booking.css';
import '../waiter-mobile/styles/waiter-mobile-shell.css';
import '../waiter-mobile/styles/waiter-mobile-overlays.css';
import '../../admin/styles/booking-admin.css';

const WAITER_NAV_TABS = [
  { key: 'tables', labelKey: 'rst.pos.tables' },
  { key: 'bookings', labelKey: 'rst.pos.bookings' },
];

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

function FloorSectionSwitch({ p, variant = 'toolbar', mineMode = false }) {
  if (!p.access.canViewBooking && !mineMode) return null;
  const iconSize = variant === 'header' ? 20 : 15;
  // Schema toolbar already has «Мои столы» status chip — section tab stays «Столы».
  const tablesLabel = p.t('rst.pos.tables');
  return (
    <div
      className={`rst-floor-section-tabs rst-floor-section-tabs--${variant}`}
      role="tablist"
      aria-label={tablesLabel}
    >
      <button
        type="button"
        role="tab"
        aria-selected={p.floorSection === 'tables'}
        className={`rst-floor-section-tabs__btn${p.floorSection === 'tables' ? ' is-active' : ''}`}
        onClick={() => p.setFloorSection('tables')}
      >
        <LayoutGrid size={iconSize} aria-hidden />
        {tablesLabel}
      </button>
      {p.access.canViewBooking ? (
        <button
          type="button"
          role="tab"
          aria-selected={p.floorSection === 'bookings'}
          className={`rst-floor-section-tabs__btn${p.floorSection === 'bookings' ? ' is-active' : ''}`}
          onClick={() => p.setFloorSection('bookings')}
        >
          <CalendarDays size={iconSize} aria-hidden />
          {p.t('rst.pos.bookings')}
        </button>
      ) : null}
    </div>
  );
}

function isWaiterTable(table, waiterUserId) {
  if (waiterUserId == null || waiterUserId === '') return false;
  const mine = String(waiterUserId);
  return tableActiveOrders(table).some(
    (order) => order?.waiterUserId != null && String(order.waiterUserId) === mine,
  );
}

function FloorBody({ p, a, mobile, user, mineMode }) {
  const bookingAccess = {
    canCreate: p.access.canCreateBooking,
    canManage: p.access.canManageBooking,
  };
  // Mobile: all tables on the board. Desktop waiter: hall schema in the main panel.
  const desktopMine = mineMode && !mobile;
  const allHallsSelected = p.selectedHallId === ALL_HALLS_ID || p.selectedHallId == null;

  const applyWaiterBoardFilter = (tables) => {
    if (p.statusFilter === 'MINE') return filterTablesByWaiter(tables, user?.id);
    if (p.statusFilter === 'FREE') {
      // Free + cleaning — take / mark-ready on the schema.
      return (tables ?? []).filter((table) => {
        const status = String(table?.status || '').toUpperCase();
        return status === 'FREE' || status === 'CLEANING';
      });
    }
    if (p.statusFilter === 'ALL' || !p.statusFilter) return tables ?? [];
    return filterTablesByStatus(tables, p.statusFilter);
  };

  // Schema layout is per-hall. «Все залы» → cards across halls (coords would overlap).
  const schemaHall = useMemo(() => {
    if (!desktopMine || allHallsSelected) return undefined;
    const realHalls = (p.halls ?? []).filter((hall) => hall?.id != null);
    if (!realHalls.length) return null;
    const source = realHalls.find((hall) => hall.id === p.selectedHallId) ?? realHalls[0];
    return { ...source, tables: applyWaiterBoardFilter(source.tables ?? []) };
  }, [desktopMine, allHallsSelected, p.halls, p.selectedHallId, p.statusFilter, user?.id]);

  if (p.floorSection === 'bookings') {
    return mobile ? (
      <>
        <FloorSectionSwitch p={p} mineMode={false} />
        <WaiterMobileBookingBoard access={bookingAccess} />
      </>
    ) : (
      <BookingWorkspace compact access={bookingAccess} />
    );
  }

  const listTables = desktopMine
    ? applyWaiterBoardFilter(p.hallTables)
    : p.hallTables;
  // Full halls on schema so free/green tables are always available per hall.
  const railHalls = p.halls;

  const handleSchemaTableClick = (table) => {
    const status = String(table?.status || '').toUpperCase();
    if (status === 'FREE') {
      p.beginDraftTable(table);
      return;
    }
    if (status === 'OCCUPIED' || status === 'WAITING_PAYMENT') {
      // Red table → modal: continue (add) or «Новый счёт».
      a.openOccupied(table, { forceInspect: true });
      return;
    }
    if (status === 'CLEANING' || status === 'RESERVED' || isWaiterTable(table, user?.id)) {
      p.handleTableClick(table);
    }
  };

  const boardProps = {
    hallTables: listTables,
    halls: railHalls,
    selectedHallId: p.selectedHallId,
    onSelectHall: p.setSelectedHallId,
    selectedTableId: p.draftTable?.id ?? p.openTable?.id ?? p.reservedTable?.id ?? a.inspectTable?.id,
    onTableClick: desktopMine ? handleSchemaTableClick : p.handleTableClick,
    onPrefetchOrder: p.prefetchOrder,
    waiterNameById: p.waiterNameById,
    t: p.t,
  };

  return (
    <>
      {p.isError ? <div className="rst-notice">{p.t('rst.floor.loadFailed')}</div> : null}
      {mobile ? (
        <WaiterMobileFloorBoard
          {...boardProps}
          mineMode={false}
          search={p.floorSearch}
          onSearchChange={p.setFloorSearch}
          sectionSwitch={<FloorSectionSwitch p={p} mineMode={false} />}
          statusFilter={p.statusFilter}
          onStatusFilter={p.setStatusFilter}
        />
      ) : (
        <FloorTableGrid
          {...boardProps}
          mineMode={desktopMine}
          schemaHall={desktopMine ? schemaHall : undefined}
          isSchemaTableSelectable={desktopMine
            ? (table) => {
              const status = String(table?.status || '').toUpperCase();
              if (status === 'BLOCKED') return false;
              return status === 'FREE'
                || status === 'CLEANING'
                || status === 'RESERVED'
                || status === 'OCCUPIED'
                || status === 'WAITING_PAYMENT'
                || isWaiterTable(table, user?.id);
            }
            : undefined}
          statusFilter={p.statusFilter}
          onStatusFilter={desktopMine ? p.setStatusFilter : undefined}
          schemaFilters
        />
      )}
    </>
  );
}

function buildOrderWorkspaceProps(p) {
  const order = p.orderForUi ?? p.order;
  if (!order) return null;
  const draft = !!p.isDraftOrder;
  return {
    order,
    menuItems: p.menuItems,
    onBack: () => {
      if (draft) p.clearDraft();
      else p.setActiveOrderId(null);
    },
    backLabel: p.t('rst.order.backToFloor'),
    hallName: draft ? p.draftHallName : p.orderHallName,
    waiterName: order.waiterUserId
      ? p.waiterNameById.get(String(order.waiterUserId))
      : null,
    onAddItem: p.handleAddItem,
    onComposeFamily: p.handleComposeFamily,
    onQty: draft ? undefined : p.handleQty,
    onRemove: draft ? undefined : p.handleRemoveItem,
    onCancel: draft ? undefined : () => p.cancelMutation.mutate(),
    canCancel: !draft && p.canCancel,
    allowKitchenRefuse: !draft && !!p.access?.canCancelOrder,
    canSendKitchen: !draft && p.canSendKitchen,
    sendingKitchen: p.sendKitchenMutation.isPending,
    onSendKitchen: draft ? undefined : () => p.sendKitchenMutation.mutate(),
    canRequestBill: !draft && p.canRequestBill,
    canPay: false,
    onRequestBill: draft ? undefined : () => p.billMutation.mutate(),
    onPay: undefined,
    onGuestsChange: draft ? undefined : (payload) => p.updateGuestsMutation.mutate(payload),
    guestsPending: p.updateGuestsMutation.isPending,
    billingPending: p.billMutation.isPending,
    paying: false,
    servicePreview: draft ? null : p.servicePreview,
    waiters: !draft && p.access.canAssignWaiter ? p.waiters : [],
    onAssignWaiter: !draft && p.access.canAssignWaiter
      ? (waiterUserId) => p.assignWaiterMutation.mutate(waiterUserId)
      : undefined,
    assigningWaiter: p.assignWaiterMutation.isPending,
    onEditNote: draft ? undefined : p.openLineNote,
    onNewCheck: !draft && p.access?.canOpenOrder && order?.tableId && !p.openExtraCheckPending ? () => {
      const table = (p.halls || []).flatMap((hall) => hall.tables || [])
        .find((row) => row.id === order.tableId)
        || { id: order.tableId };
      p.openExtraCheck(table, {
        guestCount: order.guestCount,
        waiterUserId: order.waiterUserId,
      });
    } : undefined,
    footerVariant: 'waiter',
    t: p.t,
  };
}

/**
 * Waiter floor POS only — tables, bookings, order compose, bill/print.
 * No counter sales, payment, returns, hardware strip, or cashier shift cash.
 */
export default function RestaurantFloorPosPage() {
  const user = useAuthStore((s) => s.user);
  const p = useFloorPosPage();
  const mobile = useWaiterMobileLayout();
  const a = p.tableActions;

  if (p.workspace.isLoading && p.workspace.storeId == null) {
    const loadingClass = mobile.enabled ? 'rst-app rst-pos rst-pos--waiter-mobile' : 'rst-app rst-pos';
    return (
      <div className={loadingClass}>
        <div className="rst-notice">{p.t('common.loading')}</div>
      </div>
    );
  }

  if (p.workspace.noAssignment || p.workspace.multipleAssignment) {
    return (
      <RestaurantWorkspaceEmpty
        t={p.t}
        workspace={p.workspace}
        onLogout={() => logoutAndResetSession()}
      />
    );
  }

  const orderOpen = Boolean(p.activeOrderId || p.isDraftOrder);
  const rootClass = [
    'rst-app rst-pos',
    mobile.enabled ? 'rst-pos--waiter-mobile' : '',
    mobile.enabled && orderOpen ? 'rst-pos--waiter-order-open' : '',
  ].filter(Boolean).join(' ');
  const orderProps = buildOrderWorkspaceProps(p);
  const mineMode = String(user?.role || '').toUpperCase() === 'WAITER';
  const waiterNavTabs = p.access.canViewBooking
    ? WAITER_NAV_TABS
    : WAITER_NAV_TABS.filter((row) => row.key !== 'bookings');

  return (
    <div className={rootClass}>
      <header className="rst-pos__top">
        {!mobile.enabled ? (
          <CashierNavLookup
            activeTab={p.floorSection === 'bookings' ? 'bookings' : 'tables'}
            tabs={waiterNavTabs}
            onSelect={(key) => {
              if (key === 'bookings') {
                if (p.isDraftOrder) p.clearDraft();
                else if (p.activeOrderId) p.setActiveOrderId(null);
                p.setFloorSection('bookings');
                return;
              }
              p.setFloorSection('tables');
            }}
            t={p.t}
          />
        ) : null}
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.waiter.title')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
          </span>
        </div>
        <WaiterShiftHint p={p} />
        {!mobile.enabled ? <div id="rst-pos-search-slot" className="rst-pos__search" /> : null}
        <div className="rst-pos__actions">
          {mobile.enabled ? (
            <WaiterMobileHeaderActions
              enabled={mobile.enabled}
              displayName={user?.fullName || user?.username || ''}
              storeName={p.workspace.storeName ?? ''}
              roleLabel={p.t(`roles.${user?.role || 'WAITER'}`, { defaultValue: p.t('roles.WAITER') })}
              canAdmin={p.canAdmin}
              canCashier={usesCashierPos(user?.role)}
              showExitMobile={mobile.showExitMobile}
              onExitMobile={mobile.exitMobile}
            />
          ) : (
            <>
              {p.canAdmin ? (
                <Link to="/rst/admin/dashboard">
                  <BaseButton type="button" variant="ghost">{p.t('rst.pos.backToAdmin')}</BaseButton>
                </Link>
              ) : null}
              <RestaurantThemeSwitch />
              <LanguageSwitcher variant="rst" />
              {mobile.showEnterMobile ? (
                <WaiterEnterMobileButton onEnter={mobile.enterMobile} />
              ) : null}
              <BaseButton
                type="button"
                variant="ghost"
                className="rst-exit-btn"
                onClick={() => logoutAndResetSession()}
              >
                {p.t('nav.logout')}
              </BaseButton>
            </>
          )}
        </div>
      </header>

      <div className="rst-pos__body">
        {orderOpen ? (
          orderProps ? (
            mobile.enabled ? (
              <WaiterMobileOrderWorkspace {...orderProps} />
            ) : (
              <OrderWorkspace {...orderProps} />
            )
          ) : (
            <div className="rst-notice">{p.t('common.loading')}</div>
          )
        ) : (
          <FloorBody p={p} a={a} mobile={mobile.enabled} user={user} mineMode={mineMode} />
        )}
      </div>

      <FloorPosModals p={p} waiterMode />
    </div>
  );
}
