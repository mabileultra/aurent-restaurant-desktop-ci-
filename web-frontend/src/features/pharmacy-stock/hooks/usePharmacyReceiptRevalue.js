import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';

export function usePharmacyReceiptRevalue({
  receiptId,
  lines = [],
  selection,
  t,
  onUpdated,
}) {
  const [mode, setMode] = useState(null);
  const selectedIds = selection.selectedRows.map((row) => row.id).filter(Boolean);
  const applyAll = selectedIds.length === 0;
  const targetCount = applyAll ? lines.length : selectedIds.length;

  const mutation = useMutation({
    mutationFn: async (body) => {
      await pharmacyWarehouseApi.revalueLines(receiptId, body);
      const fresh = await pharmacyWarehouseApi.getReceipt(receiptId, { timeout: 180000 });
      return fresh.data;
    },
    onSuccess: (data, body) => {
      toast.success(
        body.vatPercent != null
          ? t('pharmacyStock.bulkVatSuccess', { count: targetCount })
          : t('pharmacyStock.bulkRevalueSuccess', { count: targetCount }),
      );
      onUpdated?.(data);
      selection.clearSelection();
      setMode(null);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const submit = (raw) => {
    const n = Number(String(raw ?? '').replace(',', '.').trim());
    if (!Number.isFinite(n) || n < 0 || (mode === 'vat' && n > 100)) {
      toast.error(t('pharmacyStock.bulkValueInvalid'));
      return;
    }
    mutation.mutate({
      lineIds: applyAll ? undefined : selectedIds,
      vatPercent: mode === 'vat' ? n : undefined,
      markupPercent: mode === 'markup' ? n : undefined,
    });
  };

  return {
    mode,
    openVat: () => setMode('vat'),
    openMarkup: () => setMode('markup'),
    close: () => setMode(null),
    canOpen: lines.length > 0,
    applyAll,
    targetCount,
    saving: mutation.isPending,
    submit,
  };
}
