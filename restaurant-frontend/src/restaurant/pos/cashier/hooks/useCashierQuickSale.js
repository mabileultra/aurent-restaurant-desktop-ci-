import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../../api/order.api';
import { toastApiError } from '../../../../utils/apiError';

/** Open a takeaway check with no table and no guest form. */
export function useCashierQuickSale({ storeId, shift, onOpened }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => rstOrderApi.openTakeaway(storeId, {}).then((r) => r.data),
    onSuccess: (created) => {
      if (created?.id != null) {
        qc.setQueryData(['rst-order', created.id], created);
      }
      qc.invalidateQueries({ queryKey: ['rst-counter-orders', storeId] });
      qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
      onOpened?.(created);
    },
    onError: (err) => toastApiError(err, t('rst.cashier.quickSaleFailed')),
  });

  return {
    pending: mutation.isPending,
    start: () => {
      if (storeId == null || mutation.isPending) return;
      if (!shift?.id) {
        toast.error(t('rst.shift.required'));
        return;
      }
      mutation.mutate();
    },
  };
}
