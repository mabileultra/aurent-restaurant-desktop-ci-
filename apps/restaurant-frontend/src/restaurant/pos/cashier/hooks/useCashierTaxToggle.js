import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../../api/multikassa.api';
import { toastApiError } from '../../../../utils/apiError';

export function useCashierTaxToggle(storeId) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const queryKey = ['rst-cashier-tax', storeId];

  const query = useQuery({
    queryKey,
    enabled: storeId != null,
    queryFn: () => multikassaApi.getCashierCapabilities(storeId).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (enabled) => multikassaApi
      .updateCashierFlags(storeId, query.data?.cashRegisterId ?? null, { enabled })
      .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data);
      toast.success(
        data?.enabled ? t('rst.cashier.taxSavedOn') : t('rst.cashier.taxSavedOff'),
        { id: 'rst-cashier-tax' },
      );
    },
    onError: (err) => toastApiError(err, t('rst.cashier.taxSaveFailed')),
  });

  return {
    enabled: Boolean(query.data?.enabled),
    loading: query.isLoading,
    pending: mutation.isPending,
    toggle: () => {
      if (storeId == null || mutation.isPending) return;
      mutation.mutate(!query.data?.enabled);
    },
  };
}
