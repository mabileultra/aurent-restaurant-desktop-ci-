import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';

export function usePharmacyProductDelete(t, { onDone } = {}) {
  const qc = useQueryClient();
  const [pending, setPending] = useState([]);

  const mutation = useMutation({
    mutationFn: async (products) => {
      const ids = (products || []).map((row) => row?.id).filter(Boolean);
      if (ids.length === 0) return 0;
      if (ids.length === 1) {
        await pharmacyWarehouseApi.deactivate(ids[0]);
        return 1;
      }
      await pharmacyWarehouseApi.bulkDeactivate({ productIds: ids });
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(count > 1
        ? t('pharmacyStock.deletedMany', { count })
        : t('pharmacyStock.deleted'));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['pharmacy-products'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-warehouse-products'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      setPending([]);
      onDone?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const ask = (products) => {
    const rows = (Array.isArray(products) ? products : [products])
      .filter((row) => row?.id && row.active !== false);
    if (!rows.length) return;
    setPending(rows);
  };

  return {
    pending,
    ask,
    close: () => setPending([]),
    confirm: () => mutation.mutate(pending),
    deleting: mutation.isPending,
  };
}
