import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { returnApi } from '../../../api';

export function useReturnMutations({ catalogKind, qc, t, setEditRow, setMenuOpenId }) {
  const updateReasonMutation = useMutation({
    mutationFn: ({ id, reason }) => {
      if (catalogKind === 'pharmacy') {
        return Promise.reject(new Error(t('returnsModule.pharmacyReasonSoon', {
          defaultValue: 'Изменение причины возврата для аптеки пока недоступно',
        })));
      }
      return returnApi.updateReason(id, { reason });
    },
    onSuccess: () => {
      toast.success(t('returnsModule.updateReasonSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setEditRow?.(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? t('returnsModule.updateReasonFailed')),
  });

  const cancelReturnMutation = useMutation({
    mutationFn: (id) => {
      if (catalogKind === 'pharmacy') {
        return Promise.reject(new Error(t('returnsModule.pharmacyCancelSoon', {
          defaultValue: 'Отмена возврата для аптеки пока недоступна из журнала',
        })));
      }
      return returnApi.delete(id);
    },
    onSuccess: () => {
      toast.success(t('returnsModule.cancelReturnSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setMenuOpenId?.(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? t('returnsModule.cancelReturnFailed')),
  });

  return {
    updateReasonMutation,
    cancelReturnMutation,
  };
}
