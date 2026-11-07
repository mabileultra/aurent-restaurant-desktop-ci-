import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';

export function useAccessRightsCopyActions({ refetchAll, isRu }) {
  const qc = useQueryClient();
  const [copySourceUser, setCopySourceUser] = useState(null);
  const [copyInitialTargets, setCopyInitialTargets] = useState([]);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const [isCopyTemplateOpen, setIsCopyTemplateOpen] = useState(false);
  const [isCopyingTemplate, setIsCopyingTemplate] = useState(false);
  const [copyTemplateTarget, setCopyTemplateTarget] = useState({ targetBT: '', targetRole: '' });

  const handleOpenCopyStaff = (user, initialTargets = []) => {
    setCopySourceUser(user);
    setCopyInitialTargets(initialTargets);
    setIsCopyModalOpen(true);
  };

  const handleOpenCopyTemplate = (targetBT, targetRole) => {
    setCopyTemplateTarget({ targetBT, targetRole });
    setIsCopyTemplateOpen(true);
  };

  const handleConfirmCopyStaff = async ({ sourceUserId, targetUserIds, strategy }) => {
    setIsCopying(true);
    try {
      await platformModuleAccessApi.copy({
        sourceUserId,
        targetUserIds,
        strategy: strategy || 'MERGE',
      });
      toast.success(
        isRu
          ? `Права успешно скопированы для ${targetUserIds.length} сотр.`
          : `${targetUserIds.length} ta xodimga ruxsatlar muvaffaqiyatli nusxalandi`
      );
      setIsCopyModalOpen(false);
      refetchAll();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при копировании прав' : 'Nusxalashda xatolik yuz berdi')
      );
    } finally {
      setIsCopying(false);
    }
  };

  const handleConfirmCopyTemplate = async ({ sourceBT, sourceRole, targetBT, targetRole }) => {
    setIsCopyingTemplate(true);
    try {
      const res = await platformModuleAccessApi.getRoleTemplate(sourceBT, sourceRole);
      const sourceModules = res?.data?.modules || {};
      await platformModuleAccessApi.updateRoleTemplate(targetBT, targetRole, {
        modules: sourceModules,
      });
      toast.success(
        isRu ? `Шаблон успешно скопирован в ${targetRole}` : 'Shablon muvaffaqiyatli nusxalandi'
      );
      qc.invalidateQueries({ queryKey: ['access-role-template'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-role-template'] });
      setIsCopyTemplateOpen(false);
      refetchAll();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при копировании шаблона' : 'Shablon nusxasini saqlashda xatolik')
      );
    } finally {
      setIsCopyingTemplate(false);
    }
  };

  return {
    copySourceUser,
    copyInitialTargets,
    isCopyModalOpen,
    setIsCopyModalOpen,
    isCopying,
    handleOpenCopyStaff,
    handleConfirmCopyStaff,
    isCopyTemplateOpen,
    setIsCopyTemplateOpen,
    copyTemplateTarget,
    handleOpenCopyTemplate,
    isCopyingTemplate,
    handleConfirmCopyTemplate,
  };
}
