import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { draftOrderFromTable } from '../utils/draftOrderFromTable';
import { optimisticAddItem } from '../utils/optimisticOrderPatch';
import { resolveOrderHallName } from '../utils/floorPosDerivations';

/**
 * Free-table draft check: paint lines before open(), then merge into real order id.
 */
export function useFloorDraftSession({
  t,
  access,
  ensureShift,
  activeOrderId,
  setActiveOrderId,
  setReservedTable,
  setOpenTable,
  closeInspect,
  order,
  halls,
  selectedHallName,
  qc,
  openMutation,
  addItemMutation,
}) {
  const [draftTable, setDraftTable] = useState(null);
  const [draftUiOrder, setDraftUiOrder] = useState(null);
  const draftUiOrderRef = useRef(null);
  const draftTableRef = useRef(null);
  const openDraftPromiseRef = useRef(null);

  const paintDraftUi = (next) => {
    draftUiOrderRef.current = next;
    setDraftUiOrder(next);
  };

  const clearDraft = () => {
    draftTableRef.current = null;
    setDraftTable(null);
    paintDraftUi(null);
  };

  const clearDraftTableOnly = () => {
    draftTableRef.current = null;
    setDraftTable(null);
  };

  const beginDraftTable = (table) => {
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return false;
    }
    if (!ensureShift()) return false;
    if (!table?.id) return false;
    setReservedTable?.(null);
    setOpenTable?.(null);
    closeInspect?.();
    draftTableRef.current = table;
    setDraftTable(table);
    paintDraftUi(draftOrderFromTable(table));
    setActiveOrderId(null);
    return true;
  };

  const ensureOrderId = async () => {
    if (activeOrderId) return activeOrderId;
    if (openDraftPromiseRef.current) return openDraftPromiseRef.current;
    const table = draftTableRef.current;
    if (!table?.id) throw new Error('table required');
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      throw new Error('no permission');
    }
    if (!ensureShift()) throw new Error('shift required');
    openDraftPromiseRef.current = (async () => {
      try {
        const created = await openMutation.mutateAsync({
          table,
          guestCount: 1,
          childrenCount: 0,
        });
        clearDraftTableOnly();
        return created.id;
      } finally {
        openDraftPromiseRef.current = null;
      }
    })();
    return openDraftPromiseRef.current;
  };

  const addToOrder = async (payload) => {
    try {
      const orderId = await ensureOrderId();
      const painted = draftUiOrderRef.current;
      if (painted?.items?.length) {
        qc.setQueryData(['rst-order', orderId], {
          ...painted,
          id: orderId,
          _draft: false,
        });
      }
      addItemMutation.mutate({ ...payload, orderId });
    } catch {
      paintDraftUi(draftOrderFromTable(draftTableRef.current));
    }
  };

  const paintOptimisticAdd = (menuItem, patch) => {
    if (!draftTableRef.current) return false;
    paintDraftUi(optimisticAddItem(
      draftUiOrderRef.current || draftOrderFromTable(draftTableRef.current),
      menuItem,
      patch,
    ));
    void addToOrder({ menuItem, ...patch });
    return true;
  };

  useEffect(() => {
    if (activeOrderId && (order?.items?.length || 0) > 0) {
      paintDraftUi(null);
    }
  }, [activeOrderId, order?.items?.length]);

  const orderForUi = useMemo(() => {
    if (activeOrderId) {
      if (order?.items?.length) return order;
      if (draftUiOrder?.items?.length) {
        return {
          ...draftUiOrder,
          id: activeOrderId,
          orderNo: order?.orderNo ?? draftUiOrder.orderNo,
          _draft: false,
        };
      }
      return order;
    }
    return draftUiOrder || draftOrderFromTable(draftTable);
  }, [activeOrderId, order, draftUiOrder, draftTable]);

  const draftHallName = (draftTable || draftUiOrder)
    ? resolveOrderHallName(
      halls,
      { tableId: draftTable?.id ?? draftUiOrder?.tableId },
      selectedHallName,
    )
    : null;

  return {
    draftTable,
    draftTableRef,
    draftUiOrder,
    clearDraft,
    beginDraftTable,
    paintOptimisticAdd,
    orderForUi,
    draftHallName,
    isDraftOrder: Boolean(draftTable && !activeOrderId),
  };
}
