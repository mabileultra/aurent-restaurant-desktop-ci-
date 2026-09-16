import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';

export function usePharmacyProductDelete(t) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id) => pharmacyWarehouseApi.deactivate(id),
    onSuccess: () => {
      toast.success(t('pharmacyStock.deleted'));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['pharmacy-products'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const remove = (product) => {
    if (!product?.id) return;
    const name = product.name || product.sku || '';
    if (!window.confirm(t('pharmacyStock.deleteConfirm', { name }))) return;
    mutation.mutate(product.id);
  };

  return { remove, deleting: mutation.isPending };
}
