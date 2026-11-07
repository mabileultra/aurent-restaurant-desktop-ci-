import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { platformModuleAccessApi } from '../../../../../api';
import { parseUserDetailModules } from './staffFlowHelpers';
import { useStaffFlowMutations } from './useStaffFlowMutations';

export function useAccessRightsStaffFlow({
  users = [],
  rawCatalog = [],
  onStaffUpdated,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const [selectedUser, setSelectedUser] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [savedOverrides, setSavedOverrides] = useState({});
  const [checkedIds, setCheckedIds] = useState(new Set());

  // Auto-select first user if selection is missing or not in filtered list
  useEffect(() => {
    if (users.length === 0) {
      if (selectedUser) setSelectedUser(null);
      return;
    }
    const currentId = selectedUser?.userId || selectedUser?.id;
    const found = users.find((u) => (u.userId || u.id) === currentId);
    if (!found) setSelectedUser(users[0]);
  }, [users, selectedUser]);

  const selectedUserId = selectedUser?.userId || selectedUser?.id;

  const {
    data: userDetail,
    isLoading: isUserDetailLoading,
    refetch: refetchUserDetail,
  } = useQuery({
    queryKey: ['access-user-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await platformModuleAccessApi.getUser(selectedUserId);
      return res?.data || null;
    },
    enabled: Boolean(selectedUserId),
    staleTime: 30_000,
  });

  const { userModules, templateModules, initialOverrides } = useMemo(() => {
    return parseUserDetailModules(userDetail, selectedUser, rawCatalog);
  }, [userDetail, selectedUser, rawCatalog]);

  useEffect(() => {
    setOverrides(initialOverrides);
    setSavedOverrides(initialOverrides);
  }, [initialOverrides]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    Object.keys(overrides).forEach((k) => {
      if (overrides[k] !== savedOverrides[k]) count += 1;
    });
    return count;
  }, [overrides, savedOverrides]);

  const isDirty = dirtyCount > 0;

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChangeOverride = useCallback((moduleId, newMode) => {
    setOverrides((prev) => ({ ...prev, [moduleId]: newMode }));
  }, []);

  const handleCancel = useCallback(() => {
    setOverrides(savedOverrides);
  }, [savedOverrides]);

  const handleSelectUser = useCallback(
    (nextUser) => {
      if (!nextUser) return;
      const nextId = nextUser.userId || nextUser.id;
      if (nextId === selectedUserId) return;

      if (isDirty) {
        const confirmMsg = isRu
          ? 'У вас есть несохранённые изменения. Переключить сотрудника без сохранения?'
          : 'Sizda saqlanmagan o‘zgarishlar bor. Bekor qilib boshqa xodimga o‘tishni xohlaysizmi?';
        if (!window.confirm(confirmMsg)) return;
      }
      setSelectedUser(nextUser);
    },
    [isDirty, isRu, selectedUserId]
  );

  const { saveMutation, resetMutation, bulkResetMutation } = useStaffFlowMutations({
    selectedUserId,
    userModules,
    overrides,
    templateModules,
    isRu,
    onStaffUpdated,
    setSavedOverrides,
    setCheckedIds,
  });

  const handleToggleCheckUser = useCallback((uid, checked) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(uid);
      else next.delete(uid);
      return next;
    });
  }, []);

  const handleToggleCheckAll = useCallback(
    (checked) => {
      setCheckedIds(checked ? new Set(users.map((u) => u.userId || u.id)) : new Set());
    },
    [users]
  );

  return {
    selectedUser,
    setSelectedUser: handleSelectUser,
    selectedUserId,
    userModules,
    overrides,
    templateModules,
    isDirty,
    dirtyCount,
    isSaving: saveMutation.isPending,
    isResetting: resetMutation.isPending,
    isResettingBulk: bulkResetMutation.isPending,
    isUserDetailLoading,
    checkedIds,
    handleChangeOverride,
    handleCancel,
    handleSave: () => saveMutation.mutate(),
    handleResetUser: (uid) => resetMutation.mutate(uid),
    handleBulkReset: () => bulkResetMutation.mutate(Array.from(checkedIds)),
    handleToggleCheckUser,
    handleToggleCheckAll,
    handleClearChecked: () => setCheckedIds(new Set()),
    refetchUserDetail,
  };
}
