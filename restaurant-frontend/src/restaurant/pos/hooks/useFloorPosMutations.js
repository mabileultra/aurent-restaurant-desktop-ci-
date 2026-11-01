import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createFloorPosMutationCache } from './floorPosMutationCache';
import { useFloorOpenMutations } from './useFloorOpenMutations';
import { useFloorLineMutations } from './useFloorLineMutations';
import { useFloorOrderFlowMutations } from './useFloorOrderFlowMutations';
import { useFloorPayMutations } from './useFloorPayMutations';

/** Thin facade: open/shift + lines + lifecycle + pay. */
export function useFloorPosMutations(deps) {
  const {
    t, storeId, storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, servicePreview,
    waiterNameById, user,
    setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm,
    setShiftModal, setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote,
    setPendingWeightItem, setPaidReceipt,
    closePayModal,
  } = deps;

  const qc = useQueryClient();
  const cache = useMemo(
    () => createFloorPosMutationCache(qc, { storeId, activeOrderId, t }),
    [qc, storeId, activeOrderId, t],
  );

  const open = useFloorOpenMutations({
    t, storeId, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift,
    setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm, setShiftModal,
    cache,
  });

  const lines = useFloorLineMutations({
    t, qc, activeOrderId, order,
    setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote,
    setPendingWeightItem,
    cache,
  });

  const flow = useFloorOrderFlowMutations({
    t, qc, storeId, activeOrderId, order, setActiveOrderId, cache,
  });

  const pay = useFloorPayMutations({
    t, storeId, storeName, order, servicePreview, waiterNameById, user, shift,
    setActiveOrderId, setPaidReceipt, closePayModal, cache,
  });

  return {
    ...open,
    ...lines,
    ...flow,
    ...pay,
  };
}
