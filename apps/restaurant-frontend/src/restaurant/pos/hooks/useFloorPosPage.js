import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { formatShiftOpenDuration } from '../utils/formatElapsed';
import {
  emptyGuestForm, emptyCounterForm, resolveBackLabelKey,
} from '../utils/floorPosDerivations';
import { ALL_HALLS_ID } from '../utils/floorStatusFilters';
import { resolveFloorAccess } from '../utils/floorRoleAccess';
import { useFloorPosMutations } from './useFloorPosMutations';
import { useRestaurantAslMarking } from './useRestaurantAslMarking';
import { useFloorTableActions } from './useFloorTableActions';
import { useStoreFloorSync } from './useStoreFloorSync';
import { useMenuPhotos } from '../../shared/hooks/useMenuPhotos';
import { useMenuImageShiftPreload } from '../../shared/hooks/useMenuImageShiftPreload';
import { useFloorPosQueries } from './useFloorPosQueries';
import { useFloorComposeState } from './useFloorComposeState';
import { useFloorDraftSession } from './useFloorDraftSession';
import { useFloorOrderLineActions } from './useFloorOrderLineActions';
import { useFloorTableSession } from './useFloorTableSession';

/** Thin facade: wires queries / draft / lines / table session for Floor POS. */
export function useFloorPosPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();
  const workspace = useRestaurantWorkspaceStore();
  const access = resolveFloorAccess(user?.role, {
    requestBillGrant: hasModule('restaurantRequestBill'),
  });

  const [posMode, setPosMode] = useState('floor');
  const [floorSection, setFloorSection] = useState('tables');
  const [selectedHallId, setSelectedHallId] = useState(ALL_HALLS_ID);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openTable, setOpenTable] = useState(null);
  const [reservedTable, setReservedTable] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterForm, setCounterForm] = useState(emptyCounterForm());
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [shiftModal, setShiftModal] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [floorSearch, setFloorSearch] = useState('');
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const compose = useFloorComposeState();
  const channel = posMode === 'takeaway' ? 'TAKEAWAY' : posMode === 'delivery' ? 'DELIVERY' : null;
  const storeId = workspace.storeId;
  const onFloor = posMode === 'floor';

  useStoreFloorSync(storeId, { activeOrderId });

  const q = useFloorPosQueries({
    storeId,
    onFloor,
    channel,
    activeOrderId,
    selectedHallId,
    pendingMenuItemId: compose.pendingMenuItem?.id,
    user,
  });

  const {
    qc, floorQuery, counterQuery, halls, selectedHall, hallTables, shift, order,
    orderPartial, orderHallName, waiters, waiterNameById, servicePreview,
    allowForeignTableOrders, canMutateOrderLines, orderFlags, prefetchOrder,
    menuItems, modifierGroups, counterOrders,
  } = q;

  const { aslMarkingEnabled, aslReady, resolveEnabled } = useRestaurantAslMarking(storeId);

  const m = useFloorPosMutations({
    t, storeId, storeName: workspace.storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, servicePreview, waiterNameById,
    user, setOpenTable, setActiveOrderId, setCounterModalOpen,
    setCounterForm, setShiftModal,
    setPendingMenuItem: compose.setPendingMenuItem,
    setPendingVariants: compose.setPendingVariants,
    setSelectedModifierIds: compose.setSelectedModifierIds,
    setPendingItemNote: compose.setPendingItemNote,
    setPendingWeightItem: compose.setPendingWeightItem,
    setPaidReceipt, closePayModal: () => setPayModalOpen(false),
  });

  const tableActions = useFloorTableActions({
    t,
    storeId,
    halls,
    waiterNameById,
    access,
    setActiveOrderId,
  });

  const ensureShift = () => {
    if (shift) return true;
    toast.error(t('rst.shift.required'));
    setShiftModal(true);
    return false;
  };

  const draft = useFloorDraftSession({
    t,
    access,
    ensureShift,
    activeOrderId,
    setActiveOrderId,
    setReservedTable,
    setOpenTable,
    closeInspect: tableActions.closeInspect,
    order,
    halls,
    selectedHallName: selectedHall?.name,
    qc,
    openMutation: m.openMutation,
    addItemMutation: m.addItemMutation,
  });

  const lines = useFloorOrderLineActions({
    t,
    access,
    order,
    activeOrderId,
    canMutateOrderLines,
    draftTableRef: draft.draftTableRef,
    addItemMutation: m.addItemMutation,
    updateItemMutation: m.updateItemMutation,
    removeItemMutation: m.removeItemMutation,
    paintOptimisticAdd: draft.paintOptimisticAdd,
    aslMarkingEnabled,
    aslReady,
    resolveEnabled,
    compose,
  });

  const session = useFloorTableSession({
    t,
    access,
    ensureShift,
    clearDraft: draft.clearDraft,
    beginDraftTable: draft.beginDraftTable,
    setActiveOrderId,
    setOpenTable,
    setReservedTable,
    setPosMode,
    setFloorSection,
    setCounterModalOpen,
    setCounterForm,
    tableActions,
    openMutation: m.openMutation,
    openExtraCheckMutation: m.openExtraCheckMutation,
    markReadyMutation: m.markReadyMutation,
  });

  const menuPhotos = useMenuPhotos(storeId);
  useMenuImageShiftPreload({
    shiftId: shift?.id ?? null,
    menuItems,
    photosEnabled: menuPhotos.enabled,
    payPending: m.payMutation.isPending,
  });

  const shiftOpenLabel = shift?.openedAt ? formatShiftOpenDuration(shift.openedAt) : null;
  const backLabelKey = resolveBackLabelKey(posMode);

  return {
    t, user, workspace, access,
    posMode, changePosMode: session.changePosMode, channel,
    floorSection, setFloorSection,
    counterOrders,
    counterLoading: counterQuery.isPending && !counterQuery.data,
    counterModalOpen, setCounterModalOpen, counterForm, setCounterForm,
    handleOpenCounter: session.handleOpenCounter, openCounterMutation: m.openCounterMutation,
    halls, selectedHall, hallTables, orderHallName,
    selectedHallId, setSelectedHallId,
    statusFilter, setStatusFilter,
    openTable, setOpenTable, reservedTable, setReservedTable,
    beginOpenTable: session.beginOpenTable,
    openExtraCheck: session.openExtraCheck,
    openExtraCheckPending: m.openExtraCheckMutation.isPending,
    guestForm, setGuestForm,
    activeOrderId, setActiveOrderId, order, orderPartial,
    menuItems,
    prefetchOrder,
    isLoading: (workspace.storeId == null && workspace.isLoading)
      || (onFloor ? floorQuery.isLoading : counterQuery.isLoading),
    isError: onFloor ? floorQuery.isError : counterQuery.isError,
    refetch: () => {
      if (onFloor) return floorQuery.refetch();
      return counterQuery.refetch();
    },
    handleTableClick: session.handleTableClick,
    handleAddItem: lines.handleAddItem,
    handleComposeFamily: lines.handleComposeFamily,
    openMutation: m.openMutation,
    addItemMutation: m.addItemMutation,
    handleQty: lines.handleQty,
    handleRemoveItem: lines.handleRemoveItem,
    canMutateOrderLines,
    allowForeignTableOrders,
    removeItemMutation: m.removeItemMutation, cancelMutation: m.cancelMutation,
    sendKitchenMutation: m.sendKitchenMutation,
    reprintPickupMutation: m.reprintPickupMutation,
    canReprintPickup: hasModule('restaurantPickupLabel'),
    billMutation: m.billMutation,
    discountMutation: m.discountMutation,
    payMutation: m.payMutation,
    paidReceipt, closePaidReceipt: () => setPaidReceipt(null),
    payModalOpen, openPayModal: () => setPayModalOpen(true),
    closePayModal: () => setPayModalOpen(false),
    refundMutation: m.refundMutation,
    pendingMenuItem: compose.pendingMenuItem,
    pendingVariants: compose.pendingVariants,
    pendingWeightItem: compose.pendingWeightItem,
    pendingItemNote: compose.pendingItemNote,
    setPendingItemNote: compose.setPendingItemNote,
    modifierGroups,
    selectedModifierIds: compose.selectedModifierIds,
    toggleModifier: lines.toggleModifier,
    selectComposeVariant: lines.selectComposeVariant,
    confirmModifiers: lines.confirmModifiers,
    confirmWeightItem: lines.confirmWeightItem,
    beginDraftTable: draft.beginDraftTable,
    clearDraft: draft.clearDraft,
    draftTable: draft.draftTable,
    isDraftOrder: draft.isDraftOrder,
    orderForUi: draft.orderForUi,
    draftHallName: draft.draftHallName,
    closeWeightPick: lines.closeWeightPick,
    closeModifiers: lines.closeModifiers,
    lineNoteEdit: compose.lineNoteEdit,
    setLineNoteEdit: compose.setLineNoteEdit,
    openLineNote: lines.openLineNote,
    saveLineNote: lines.saveLineNote,
    lineNotePending: lines.lineNotePending,
    canCancel: access.canCancelOrder || orderFlags.canCancel,
    canSendKitchen: orderFlags.canSendKitchen,
    canRequestBill: access.canRequestBill && orderFlags.canRequestBill,
    canPay: access.canPay && orderFlags.canPay,
    canAdmin: access.canConfigureHall,
    backLabelKey,
    shift, shiftOpenLabel, floorSearch, setFloorSearch, waiters, waiterNameById,
    assignWaiterMutation: m.assignWaiterMutation,
    updateGuestsMutation: m.updateGuestsMutation, servicePreview,
    shiftModal, setShiftModal, openingCash, setOpeningCash, closingCash, setClosingCash,
    openShiftMutation: m.openShiftMutation, closeShiftMutation: m.closeShiftMutation,
    tableActions,
  };
}
