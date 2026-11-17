import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../../services/api';
import {
  useOpenCashierShift,
  useCloseCashierShift,
  useXReportCashierShift,
  shiftQueryKey,
} from '../../../hooks/useCashierShift';
import { resolvePosShiftOpenErrorMessage } from '../../../utils/resolvePosShiftOpenError';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { resolveMultikassaFiscalErrorMessage } from '../../../services/multikassa';
import { resolveActiveShiftForModalAction } from '../utils/shiftModalSession';
import { printCloseShiftReports } from '../utils/shiftCloseItemsReport';

export function useCashierShiftModalMutations({
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
}) {
  const qc = useQueryClient();
  const xMutation = useXReportCashierShift(storeId, { catalogKind });

  const applyNewShift = (newShift) => {
    qc.setQueryData(shiftQueryKey(storeId, userId, catalogKind), newShift);
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    onShiftUpdated?.(newShift);
  };

  const zMutation = useMutation({
    mutationFn: () => cashierShiftApi.finalizeZReport(sessionShift?.id ?? shift?.id).then((r) => r.data),
    onSuccess: (data) => {
      applyNewShift(data.newShift);
      setSessionShift(data.newShift?.status === 'OPEN' ? data.newShift : null);
      setSessionOpen(data.newShift?.status === 'OPEN');
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      toast.success(t('pos.zReportFinalized'));
      if (printAfterLoadRef.current === 'Z') {
        printAfterLoadRef.current = null;
        queuePrint(data.report);
      }
    },
    onError: (e) => {
      printAfterLoadRef.current = null;
      toast.error(resolvePharmacyApiError(e, t, 'pos.reportFailed'));
    },
  });

  const openMutation = useOpenCashierShift(storeId, { catalogKind });
  const closeMutation = useCloseCashierShift(storeId, { catalogKind });

  const handleCloseShift = () => {
    const active = resolveActiveShiftForModalAction(sessionShift);
    if (!active?.id) {
      toast.error(t('pos.shiftCloseFailed'));
      return;
    }
    closeMutation.mutate(
      { shiftId: active.id, shift: active },
      {
        onSuccess: async (closedShift) => {
          setSessionOpen(false);
          setSessionShift(null);
          toast.success(t('pos.shiftClosedWithZReport'));
          onShiftUpdated?.(closedShift);
          setItemsPrintBusy(true);
          try {
            const printed = await printCloseShiftReports(closedShift, { storeName, cashierName, t });
            if (printed.zError) toast.error(printed.zError.message || t('receipt.printFailed'));
          } catch (err) {
            toast.error(err?.message || t('receipt.printFailed'));
          } finally {
            setItemsPrintBusy(false);
          }
          onClose();
        },
        onError: (e) =>
          toast.error(
            e?.code === 'MULTIKASSA_FISCAL_FAILED'
              || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
              || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED'
              ? resolveMultikassaFiscalErrorMessage(e, t, 'pos.shiftCloseFailed')
              : resolvePharmacyApiError(e, t, 'pos.shiftCloseFailed'),
          ),
      },
    );
  };

  const handleXReport = () => {
    const active = resolveActiveShiftForModalAction(sessionShift);
    if (!active?.id) {
      toast.error(t('pos.reportFailed'));
      return;
    }
    printAfterLoadRef.current = 'X';
    xMutation.mutate(
      { shiftId: active.id, shift: active },
      {
        onSuccess: (data) => {
          if (printAfterLoadRef.current === 'X') {
            printAfterLoadRef.current = null;
            queuePrint(data);
          }
        },
        onError: (e) => {
          printAfterLoadRef.current = null;
          toast.error(
            e?.code === 'MULTIKASSA_FISCAL_FAILED'
              || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
              || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED'
              ? resolveMultikassaFiscalErrorMessage(e, t, 'pos.reportFailed')
              : resolvePharmacyApiError(e, t, 'pos.reportFailed'),
          );
        },
      },
    );
  };

  const handleZReport = () => {
    if (!(sessionShift?.id || shift?.id)) {
      toast.error(t('pos.reportFailed'));
      return;
    }
    printAfterLoadRef.current = 'Z';
    zMutation.mutate();
  };

  const handleOpenShift = () => {
    openMutation.mutate(undefined, {
      onSuccess: (openedShift) => {
        setSessionOpen(true);
        setSessionShift(openedShift?.status === 'OPEN' ? openedShift : null);
        toast.success(t('pos.shiftOpenedSuccess'));
        onShiftUpdated?.(openedShift);
        onClose();
      },
      onError: (e) =>
        toast.error(
          e?.code === 'MULTIKASSA_FISCAL_FAILED' || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
            ? resolveMultikassaFiscalErrorMessage(e, t)
            : resolvePosShiftOpenErrorMessage(e, t, storeId),
          { id: 'pos-shift-open-error' },
        ),
    });
  };

  return {
    qc,
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
