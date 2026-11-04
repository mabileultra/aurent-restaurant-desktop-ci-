import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { storeApi } from '../../../api';
import { formatApiErrorMessage } from '../../../utils/apiErrorParser';
import { invalidateStoresQueries } from './invalidateStoresQueries';

export function useStoresPageMutations({
  t,
  editing,
  setModalOpen,
  setEditing,
  setMenuId,
}) {
  const qc = useQueryClient();
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [storeToToggleActive, setStoreToToggleActive] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing?.id ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      invalidateStoresQueries(qc, { includeCompanies: true });
      toast.success(
        editing?.id
          ? t('platform.branchUpdated', { defaultValue: 'Filial muvaffaqiyatli yangilandi' })
          : t('platform.branchCreated', { defaultValue: 'Filial muvaffaqiyatli yaratildi' })
      );
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) =>
      toast.error(
        formatApiErrorMessage(
          e,
          editing?.id
            ? t('stores.updateFailed', { defaultValue: 'Filialni yangilashda xatolik yuz berdi' })
            : t('stores.createFailed', { defaultValue: 'Filialni yaratishda xatolik yuz berdi' })
        )
      ),
  });

  const toggleMutation = useMutation({
    mutationFn: (storeOrId) => {
      const id = typeof storeOrId === 'object' ? storeOrId.id : storeOrId;
      return storeApi.toggle(id);
    },
    onSuccess: (_, storeOrId) => {
      invalidateStoresQueries(qc, { includeCompanies: true });
      const wasActive = typeof storeOrId === 'object' ? storeOrId.active : undefined;
      if (wasActive === true) {
        toast.success(t('platform.branchDeactivated', { defaultValue: 'Filial faolsizlantirildi' }));
      } else if (wasActive === false) {
        toast.success(t('platform.branchActivated', { defaultValue: 'Filial muvaffaqiyatli faollashtirildi' }));
      } else {
        toast.success(t('platform.branchStatusUpdated', { defaultValue: 'Filial holati yangilandi' }));
      }
      setMenuId?.(null);
      setStoreToToggleActive(null);
    },
    onError: (e) =>
      toast.error(
        formatApiErrorMessage(e, t('stores.statusChangeFailed', { defaultValue: 'Filial holatini o‘zgartirishda xatolik yuz berdi' }))
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      invalidateStoresQueries(qc, { includeCompanies: true });
      toast.success(t('platform.branchDeleted', { defaultValue: 'Filial o‘chirildi' }));
      setMenuId?.(null);
      setStoreToDelete(null);
    },
    onError: (e) =>
      toast.error(
        formatApiErrorMessage(e, t('stores.deleteFailed', { defaultValue: 'Filialni o‘chirishda xatolik yuz berdi' }))
      ),
  });

  const tryDelete = (row) => {
    setStoreToDelete(row);
    setMenuId?.(null);
  };

  const tryToggleActive = (row) => {
    setStoreToToggleActive(row);
    setMenuId?.(null);
  };

  return {
    saveMutation,
    toggleMutation,
    deleteMutation,
    storeToDelete,
    setStoreToDelete,
    tryDelete,
    handleConfirmDelete: (row) => deleteMutation.mutate(row.id),
    storeToToggleActive,
    setStoreToToggleActive,
    tryToggleActive,
    handleConfirmToggleActive: (row) => toggleMutation.mutate(row),
    isDeleting: deleteMutation.isPending,
    isTogglingActive: toggleMutation.isPending,
  };
}
