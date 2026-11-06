import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import {
  freeTablesForTransfer,
  occupiedTablesForMerge,
} from '../utils/floorStatusFilters';
import { toastApiError } from '../../../utils/apiError';

/**
 * Floor Phase-2 actions: inspect occupied table, transfer, merge, reassign waiter.
 */
export function useFloorTableActions({
  t,
  storeId,
  halls,
  waiterNameById,
  access,
  setActiveOrderId,
}) {
  const canTransferMerge = !!access?.canTransferMerge;
  const canAssignWaiter = !!access?.canAssignWaiter;
  const canCancelOrder = !!access?.canCancelOrder;
  const qc = useQueryClient();
  const [inspectTable, setInspectTable] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState(null);
  const [assignWaiterId, setAssignWaiterId] = useState('');

  const checks = Array.isArray(inspectTable?.activeOrders) && inspectTable.activeOrders.length
    ? inspectTable.activeOrders
    : (inspectTable?.activeOrder ? [inspectTable.activeOrder] : []);
  const orderId = selectedOrderId ?? checks[0]?.id ?? null;

  const inspectOrderQuery = useQuery({
    queryKey: ['rst-order', orderId],
    queryFn: async () => {
      return rstOrderApi.get(orderId).then((r) => r.data);
    },
    enabled: !!orderId,
    staleTime: 4_000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return count < 1;
    },
  });

  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', storeId] });

  const closeInspect = () => {
    setInspectTable(null);
    setSelectedOrderId(null);
    setTransferOpen(false);
    setMergeOpen(false);
    setAssignOpen(false);
    setTargetTableId(null);
    setAssignWaiterId('');
  };

  const transferMutation = useMutation({
    mutationFn: (targetId) => rstOrderApi.transferTable(orderId, { targetTableId: targetId }).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('rst.floor.transferDone'));
      closeInspect();
      invalidateFloor();
    },
    onError: (err) => toastApiError(err, t('rst.floor.transferFailed')),
  });

  const mergeMutation = useMutation({
    mutationFn: (secondaryId) => rstOrderApi.mergeTables(orderId, { secondaryTableId: secondaryId }).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('rst.floor.mergeDone'));
      setMergeOpen(false);
      setTargetTableId(null);
      invalidateFloor();
      qc.invalidateQueries({ queryKey: ['rst-order', orderId] });
    },
    onError: (err) => toastApiError(err, t('rst.floor.mergeFailed')),
  });

  const assignMutation = useMutation({
    mutationFn: (waiterUserId) => rstOrderApi.assignWaiter(orderId, { waiterUserId }).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('rst.order.waiterAssigned'));
      setAssignOpen(false);
      setAssignWaiterId('');
      qc.invalidateQueries({ queryKey: ['rst-order', orderId] });
      invalidateFloor();
    },
    onError: (err) => toastApiError(err, t('rst.order.waiterAssignFailed')),
  });

  const cancelInspectMutation = useMutation({
    mutationFn: async () => {
      return rstOrderApi.cancel(orderId);
    },
    onSuccess: () => {
      toast.success(t('rst.order.cancelled'));
      closeInspect();
      invalidateFloor();
      qc.removeQueries({ queryKey: ['rst-order', orderId] });
    },
    onError: (err) => toastApiError(err, t('rst.order.cancelFailed')),
  });

  const openOccupied = (table, { forceInspect = false } = {}) => {
    const rows = Array.isArray(table?.activeOrders) && table.activeOrders.length
      ? table.activeOrders
      : (table?.activeOrder ? [table.activeOrder] : []);
    // Prefer the local ticket with money/dishes — not an empty server shell.
    const preferred = rows.find((r) => r?._local && (Number(r.subtotal) || 0) > 0)
      || rows.find((r) => r?._local)
      || rows[0]
      || null;
    const firstId = preferred?.id ?? null;
    setSelectedOrderId(firstId);
    // Schema / explicit inspect: always show Continue vs «Новый счёт».
    if (!forceInspect && preferred?._local && rows.filter((r) => r?._local).length <= 1 && firstId) {
      setActiveOrderId(firstId);
      setInspectTable(null);
      setTransferOpen(false);
      setMergeOpen(false);
      setAssignOpen(false);
      return;
    }
    setInspectTable(table);
    setTransferOpen(false);
    setMergeOpen(false);
    setAssignOpen(false);
  };

  const continueOrder = () => {
    if (!orderId) return;
    setActiveOrderId(orderId);
    closeInspect();
  };

  const confirmTransfer = () => {
    if (!targetTableId) return;
    const target = freeTablesForTransfer(halls, inspectTable?.id).find((row) => row.id === targetTableId);
    if (!window.confirm(t('rst.floor.transferConfirmAsk', {
      from: inspectTable?.code,
      to: target?.code ?? targetTableId,
    }))) return;
    transferMutation.mutate(targetTableId);
  };

  const confirmMerge = () => {
    if (!targetTableId) return;
    const target = occupiedTablesForMerge(halls, inspectTable?.id).find((row) => row.id === targetTableId);
    if (!window.confirm(t('rst.floor.mergeConfirmAsk', {
      from: inspectTable?.code,
      to: target?.code ?? targetTableId,
    }))) return;
    mergeMutation.mutate(targetTableId);
  };

  const confirmAssign = () => {
    if (!assignWaiterId || !orderId) return;
    assignMutation.mutate(assignWaiterId);
  };

  const handleCancelOrder = () => {
    if (!orderId) return;
    cancelInspectMutation.mutate();
  };

  return {
    inspectTable,
    checks,
    selectedOrderId: orderId,
    selectOrder: setSelectedOrderId,
    openOccupied,
    closeInspect,
    continueOrder,
    inspectOrder: inspectOrderQuery.data,
    inspectOrderLoading: inspectOrderQuery.isLoading,
    transferOpen,
    openTransfer: () => {
      if (!canTransferMerge) return;
      setTargetTableId(null);
      setTransferOpen(true);
    },
    closeTransfer: () => setTransferOpen(false),
    mergeOpen,
    openMerge: () => {
      if (!canTransferMerge) return;
      setTargetTableId(null);
      setMergeOpen(true);
    },
    closeMerge: () => setMergeOpen(false),
    assignOpen,
    openAssign: () => {
      if (!canAssignWaiter) return;
      setAssignWaiterId('');
      setAssignOpen(true);
    },
    closeAssign: () => setAssignOpen(false),
    targetTableId,
    setTargetTableId,
    assignWaiterId,
    setAssignWaiterId,
    freeTables: freeTablesForTransfer(halls, inspectTable?.id),
    mergeCandidateTables: occupiedTablesForMerge(halls, inspectTable?.id),
    confirmTransfer,
    confirmMerge,
    confirmAssign,
    handleCancelOrder,
    transferPending: transferMutation.isPending,
    mergePending: mergeMutation.isPending,
    assignPending: assignMutation.isPending,
    currentWaiterName: inspectTable?.activeOrder?.waiterUserId
      ? waiterNameById.get(String(inspectTable.activeOrder.waiterUserId))
      : null,
    canCancelInspect: canCancelOrder || !(inspectTable?.activeOrder?.linesCount > 0),
    canTransferMerge,
    canAssignWaiter,
  };
}
