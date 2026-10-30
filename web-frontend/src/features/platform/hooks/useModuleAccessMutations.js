import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../api';
import { buildTogglesFromDetail, extractApiError } from '../utils/moduleAccessUtils';

export function useModuleAccessMutations({
  t,
  selectedUserId,
  setCustomAccess,
  setModuleToggles,
}) {
  const qc = useQueryClient();

  const invalidateUsers = () => {
    qc.invalidateQueries({ queryKey: ['platform-module-access-users'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => platformModuleAccessApi.updateUser(selectedUserId, payload),
    onSuccess: () => {
      setCustomAccess(true);
      toast.success(t('platform.moduleAccess.saved'));
      invalidateUsers();
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  const bulkSaveMutation = useMutation({
    mutationFn: async ({ userIds, payload }) => {
      for (const userId of userIds) {
        await platformModuleAccessApi.updateUser(userId, payload);
      }
    },
    onSuccess: (_data, { userIds }) => {
      toast.success(t('platform.moduleAccess.bulkSaved', { count: userIds.length }));
      invalidateUsers();
      for (const userId of userIds) {
        qc.invalidateQueries({ queryKey: ['platform-module-access-detail', userId] });
      }
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  const resetMutation = useMutation({
    mutationFn: () => platformModuleAccessApi.resetUser(selectedUserId),
    onSuccess: (res) => {
      toast.success(t('platform.moduleAccess.resetDone'));
      setCustomAccess(false);
      setModuleToggles(buildTogglesFromDetail(res.data));
      invalidateUsers();
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  return {
    saveMutation,
    bulkSaveMutation,
    resetMutation,
    isSaving: saveMutation.isPending || resetMutation.isPending || bulkSaveMutation.isPending,
  };
}
