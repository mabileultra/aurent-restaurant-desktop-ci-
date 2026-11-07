import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';

export function useRoleEmployeesBulkActions({
  selectedUserIds,
  copySourceUser,
  clearSelection,
  onUserUpdated,
}) {
  const handleBulkReset = async () => {
    const ids = Array.from(selectedUserIds);
    if (!ids.length) return;
    try {
      await platformModuleAccessApi.bulkReset({ userIds: ids });
      toast.success(`${ids.length} ta xodim shablonga qaytarildi`);
      clearSelection();
      onUserUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk reset xato');
    }
  };

  const handleCopy = async () => {
    const source = copySourceUser;
    if (!source) return;
    const sourceId = source.userId || source.id;
    const targets = Array.from(selectedUserIds).filter((id) => id !== sourceId);
    if (!targets.length) {
      toast.error('Nusxa uchun yana kamida 1 ta xodim tanlang');
      return;
    }
    try {
      await platformModuleAccessApi.copy({
        sourceUserId: sourceId,
        targetUserIds: targets,
        strategy: 'REPLACE',
      });
      toast.success(`Huquqlar ${targets.length} ta xodimga ko‘chirildi`);
      clearSelection();
      onUserUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nusxa olish xato');
    }
  };

  return {
    handleBulkReset,
    handleCopy,
  };
}
