import toast from 'react-hot-toast';
import { emptyCounterForm } from '../utils/floorPosDerivations';

/** Open / draft / extra check / counter — table lifecycle outside the line editor. */
export function useFloorTableSession({
  t,
  access,
  ensureShift,
  clearDraft,
  beginDraftTable,
  setActiveOrderId,
  setOpenTable,
  setReservedTable,
  setPosMode,
  setFloorSection,
  setCounterModalOpen,
  setCounterForm,
  tableActions,
  openMutation,
  openExtraCheckMutation,
  markReadyMutation,
}) {
  const changePosMode = (mode) => {
    if (!access.canCounterSales && mode !== 'floor') return;
    if (setActiveOrderId) setActiveOrderId(null);
    clearDraft();
    setPosMode(mode);
    setCounterModalOpen(false);
    setOpenTable(null);
    setReservedTable(null);
    tableActions.closeInspect();
    if (mode === 'floor') setFloorSection('tables');
  };

  const beginOpenTable = (table) => {
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    if (!table?.id || openMutation.isPending) return;
    clearDraft();
    setReservedTable(null);
    setOpenTable(null);
    openMutation.mutate({ table, guestCount: 1, childrenCount: 0 });
  };

  const openExtraCheck = (table, seed = {}) => {
    if (!table?.id) return;
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    if (openExtraCheckMutation.isPending) return;
    clearDraft();
    tableActions.closeInspect();
    setReservedTable(null);
    setOpenTable(null);
    openExtraCheckMutation.mutate({
      tableId: table.id,
      guestCount: seed.guestCount,
      waiterUserId: seed.waiterUserId,
    });
  };

  const handleTableClick = (table) => {
    const openOrderId = table.activeOrder?.id ?? table.activeOrderId;
    if (openOrderId) {
      clearDraft();
      tableActions.openOccupied(table);
      return;
    }
    if (table.status === 'BLOCKED') {
      toast.error(t('rst.order.blocked'));
      return;
    }
    if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') {
      toast.error(t('rst.order.alreadyOpen'));
      return;
    }
    if (table.status === 'CLEANING') {
      if (!markReadyMutation.isPending) {
        markReadyMutation.mutate(table.id);
      }
      return;
    }
    if (table.status === 'RESERVED' || table.reservation) {
      setReservedTable(table);
      return;
    }
    setReservedTable(null);
    setOpenTable(null);
    tableActions.closeInspect();
    beginDraftTable(table);
  };

  const handleOpenCounter = () => {
    if (!access.canCounterSales) return;
    if (!ensureShift()) return;
    setCounterForm(emptyCounterForm());
    setCounterModalOpen(true);
  };

  const startDraftOnTable = (table) => {
    setReservedTable(null);
    setOpenTable(null);
    tableActions.closeInspect();
    return beginDraftTable(table);
  };

  return {
    changePosMode,
    beginOpenTable,
    openExtraCheck,
    handleTableClick,
    handleOpenCounter,
    startDraftOnTable,
  };
}
