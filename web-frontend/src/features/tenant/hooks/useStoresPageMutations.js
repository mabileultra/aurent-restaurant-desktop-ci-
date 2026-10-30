import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { storeApi } from '../../../api';
import { invalidateStoresQueries } from './invalidateStoresQueries';

export function useStoresPageMutations({
  t,
  editing,
  setModalOpen,
  setEditing,
  setMenuId,
}) {
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing?.id ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      invalidateStoresQueries(qc);
      toast.success(editing?.id ? t('stores.updated') : t('stores.created'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      invalidateStoresQueries(qc);
      toast.success(t('stores.updated'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      invalidateStoresQueries(qc, { includeCompanies: true });
      toast.success(t('stores.deleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.deleteFailed')),
  });

  const tryDelete = (row) => {
    if (window.confirm(t('stores.deleteConfirm', { name: row.name }))) {
      deleteMutation.mutate(row.id);
    }
  };

  return { saveMutation, toggleMutation, deleteMutation, tryDelete };
}
