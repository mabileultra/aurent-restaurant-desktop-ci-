import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { financeBulkRun } from '../../utils/shared/financeBulkRun';

export function useFinanceRecordDelete({
  deleteFn,
  invalidate,
  selection,
  selectedDeletable,
  t,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: invalidate,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (rows) => financeBulkRun(rows, (row) => deleteFn(row.id)),
    onSuccess: ({ succeeded, failed }) => {
      invalidate();
      selection.clearSelection();
      setBulkDeleteOpen(false);
      setDeleteTarget(null);
      if (failed > 0) toast.error(t('finance.bulk.partialFail', { succeeded, failed }));
      else toast.success(t('finance.bulk.deleteSuccess', { count: succeeded }));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.deleteFailed')),
  });

  const confirmDelete = () => {
    if (bulkDeleteOpen && selectedDeletable.length > 0) {
      bulkDeleteMutation.mutate(selectedDeletable);
      return;
    }
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => {
          toast.success(t('finance.bulk.deleteSuccess', { count: 1 }));
          setDeleteTarget(null);
        },
        onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.deleteFailed')),
      });
    }
  };

  return {
    deleteTarget,
    setDeleteTarget,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    deleteMutation,
    bulkDeleteMutation,
    confirmDelete,
  };
}

export function useFinanceSelectableRows(rows, isEditableFn, selection) {
  const selectableRows = rows.filter(isEditableFn);
  const selectedDeletable = selection.selectedRows.filter(isEditableFn);

  const toggleSelectAllEditable = () => {
    const ids = selectableRows.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selection.selectedIds.has(id));
    selection.setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const allSelectableSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selection.selectedIds.has(r.id));

  return {
    selectableRows,
    selectedDeletable,
    allSelectableSelected,
    toggleSelectAllEditable,
  };
}
