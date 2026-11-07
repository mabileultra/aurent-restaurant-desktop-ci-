import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import { buildFinalUserModules } from './staffFlowHelpers';

export function useStaffFlowMutations({
  selectedUserId,
  userModules,
  overrides,
  templateModules,
  isRu,
  onStaffUpdated,
  setSavedOverrides,
  setCheckedIds,
}) {
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      const { finalModules, hasAnyException } = buildFinalUserModules(
        userModules,
        overrides,
        templateModules
      );

      if (!hasAnyException) {
        return platformModuleAccessApi.resetUser(selectedUserId);
      }

      return platformModuleAccessApi.updateUser(selectedUserId, {
        customAccess: true,
        modules: finalModules,
      });
    },
    onSuccess: () => {
      setSavedOverrides(overrides);
      toast.success(isRu ? 'Права сотрудника сохранены' : 'Xodim ruxsatlari saqlandi');
      qc.invalidateQueries({ queryKey: ['access-user-detail', selectedUserId] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при сохранении прав' : 'Ruxsatlarni saqlashda xatolik')
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (userId) => {
      return platformModuleAccessApi.resetUser(userId || selectedUserId);
    },
    onSuccess: () => {
      toast.success(
        isRu ? 'Сотрудник сброшен к шаблону роли' : 'Xodim rol shabloniga qaytarildi'
      );
      qc.invalidateQueries({ queryKey: ['access-user-detail', selectedUserId] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при сбросе к шаблону' : 'Shablonga qaytarishda xatolik')
      );
    },
  });

  const bulkResetMutation = useMutation({
    mutationFn: async (userIds) => {
      return platformModuleAccessApi.bulkReset({ userIds });
    },
    onSuccess: () => {
      toast.success(
        isRu
          ? 'Выбранные сотрудники сброшены к шаблону'
          : 'Tanlangan xodimlar shablonga qaytarildi'
      );
      setCheckedIds(new Set());
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при массовом сбросе' : 'Ommaviy qaytarishda xatolik')
      );
    },
  });

  return { saveMutation, resetMutation, bulkResetMutation };
}
