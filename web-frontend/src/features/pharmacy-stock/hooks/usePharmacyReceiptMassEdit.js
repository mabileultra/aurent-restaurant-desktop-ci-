import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';

const NUMERIC = new Set(['QUANTITY', 'PURCHASE', 'VAT', 'MARKUP', 'RETAIL']);

export function usePharmacyReceiptMassEdit({
  receiptId,
  lines = [],
  selection,
  t,
  onUpdated,
}) {
  const [pending, setPending] = useState(null);
  const selectedIds = selection.selectedRows.map((row) => row.id).filter(Boolean);
  const applyAll = selectedIds.length === 0;
  const targetCount = applyAll ? lines.length : selectedIds.length;

  const mutation = useMutation({
    mutationFn: async (body) => {
      await pharmacyWarehouseApi.massUpdateLines(receiptId, body);
      const fresh = await pharmacyWarehouseApi.getReceipt(receiptId, { timeout: 180000 });
      return fresh.data;
    },
    onSuccess: (data) => {
      toast.success(t('pharmacyStock.massEditDone', { count: targetCount }));
      onUpdated?.(data);
      selection.clearSelection();
      setPending(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message || t('pharmacyStock.saveFailed')),
  });

  const ask = (field, raw) => {
    const value = String(raw ?? '').trim();
    if (!lines.length) return;
    if (NUMERIC.has(field)) {
      const n = Number(value.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || (field === 'QUANTITY' && n <= 0)) {
        toast.error(t('pharmacyStock.bulkValueInvalid'));
        return;
      }
      if ((field === 'VAT' && n > 100) || (field === 'MARKUP' && n > 1000)) {
        toast.error(t('pharmacyStock.bulkValueInvalid'));
        return;
      }
    }
    if (field === 'EXPIRY' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      toast.error(t('pharmacyStock.errExpiry'));
      return;
    }
    setPending({
      field,
      value,
      lineIds: applyAll ? undefined : selectedIds,
      count: targetCount,
    });
  };

  return {
    pending,
    ask,
    cancel: () => setPending(null),
    confirm: () => {
      if (!pending) return;
      mutation.mutate({
        field: pending.field,
        value: pending.value,
        lineIds: pending.lineIds,
      });
    },
    saving: mutation.isPending,
    canEdit: lines.length > 0,
    targetCount,
  };
}
