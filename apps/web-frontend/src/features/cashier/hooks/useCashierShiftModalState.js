import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useConnectivityStore } from '../../../store/connectivityStore';
import {
  fetchCurrentCashierShift,
  shiftQueryKey,
} from '../../../hooks/useCashierShift';
import { resolveShiftModalSession } from '../utils/shiftModalSession';
import { useCashierShiftModalMutations } from './useCashierShiftModalMutations';

export function useCashierShiftModalState({
  open,
  onClose,
  storeId,
  storeName,
  cashierName,
  shift,
  onShiftUpdated,
  catalogKind,
  t,
}) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const isPharmacy = catalogKind === 'pharmacy';
  const [printReport, setPrintReport] = useState(null);
  const [printToken, setPrintToken] = useState(0);
  const [sessionOpen, setSessionOpen] = useState(null);
  const [sessionShift, setSessionShift] = useState(null);
  const printAfterLoadRef = useRef(null);
  const openSeqRef = useRef(0);
  const [itemsPrintBusy, setItemsPrintBusy] = useState(false);
  const [cashMovementDirection, setCashMovementDirection] = useState(null);

  const queuePrint = (data) => {
    setPrintToken((n) => n + 1);
    setPrintReport(data);
  };

  const {
    xMutation,
    zMutation,
    closeMutation,
    openMutation,
    handleCloseShift,
    handleXReport,
    handleZReport,
    handleOpenShift,
  } = useCashierShiftModalMutations({
    storeId,
    catalogKind,
    userId,
    shift,
    sessionShift,
    storeName,
    cashierName,
    t,
    onShiftUpdated,
    onClose,
    setSessionOpen,
    setSessionShift,
    queuePrint,
    printAfterLoadRef,
    setItemsPrintBusy,
  });

  useEffect(() => {
    if (!open) {
      setPrintReport(null);
      printAfterLoadRef.current = null;
      setSessionOpen(null);
      setSessionShift(null);
      return undefined;
    }
    if (storeId == null || userId == null) {
      setSessionOpen(false);
      setSessionShift(null);
      return undefined;
    }

    const seq = ++openSeqRef.current;
    setSessionOpen(null);
    setSessionShift(null);
    const storeNameHint = useConnectivityStore.getState().storeName || storeName || '';
    const user = useAuthStore.getState().user;

    qc.fetchQuery({
      queryKey: shiftQueryKey(storeId, userId, catalogKind),
      queryFn: () => fetchCurrentCashierShift(storeId, user, false, storeNameHint, { catalogKind }),
      staleTime: 0,
    })
      .then((fresh) => {
        if (openSeqRef.current !== seq) return;
        const next = resolveShiftModalSession(fresh);
        setSessionOpen(next.sessionOpen);
        setSessionShift(next.sessionShift);
      })
      .catch(() => {
        if (openSeqRef.current !== seq) return;
        setSessionOpen(false);
        setSessionShift(null);
      });

    return undefined;
  }, [open, storeId, userId, catalogKind, qc, storeName]);

  const resolving = open && sessionOpen === null;
  const isOpen = sessionOpen === true;
  const busy =
    resolving ||
    xMutation.isPending ||
    zMutation.isPending ||
    closeMutation.isPending ||
    openMutation.isPending ||
    itemsPrintBusy ||
    Boolean(printReport);

  return {
    qc,
    isPharmacy,
    printReport,
    setPrintReport,
    printToken,
    sessionOpen,
    sessionShift,
    busy,
    resolving,
    isOpen,
    cashMovementDirection,
    setCashMovementDirection,
    xMutation,
    zMutation,
    closeMutation,
    openMutation,
    handleCloseShift,
    handleXReport,
    handleZReport,
    handleOpenShift,
  };
}
