import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import { getRoleDefaultModules } from '../utils/roleDefaultModules';

export function useAccessRightsStaffFlow({
  users = [],
  rawCatalog = [],
  onStaffUpdated,
}) {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [savedOverrides, setSavedOverrides] = useState({});
  const [checkedIds, setCheckedIds] = useState(new Set());

  // Auto-select first user or sync with filtered users
  useEffect(() => {
    if (users.length === 0) {
      if (selectedUser) setSelectedUser(null);
      return;
    }
    const currentId = selectedUser?.userId || selectedUser?.id;
    const exists = users.some((u) => (u.userId || u.id) === currentId);
    if (!exists) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  const selectedUserId = selectedUser?.userId || selectedUser?.id;

  // Load user detail from backend
  const { data: userDetail, isLoading: isUserDetailLoading, refetch: refetchUserDetail } = useQuery({
    queryKey: ['access-user-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await platformModuleAccessApi.getUser(selectedUserId);
      return res?.data || null;
    },
    enabled: Boolean(selectedUserId),
    staleTime: 30_000,
  });

  // Calculate template modules for the selected user
  const templateModules = useMemo(() => {
    if (!selectedUser) return new Set();
    const bt = selectedUser.businessType || 'RESTAURANT';
    const role = selectedUser.role || 'CASHIER';
    const defaults = getRoleDefaultModules(bt, role);
    return new Set(defaults);
  }, [selectedUser]);

  // Sync overrides when user or userDetail changes
  useEffect(() => {
    if (!selectedUser) return;
    const initial = {};
    const detailModules = userDetail?.modules || {};
    const hasCustom = Boolean(userDetail?.moduleAccessCustom || selectedUser.moduleAccessCustom);

    rawCatalog.forEach((m) => {
      const inTpl = templateModules.has(m.id);
      if (hasCustom && typeof detailModules[m.id] === 'boolean') {
        const val = detailModules[m.id];
        if (val && !inTpl) initial[m.id] = 'grant';
        else if (!val && inTpl) initial[m.id] = 'deny';
        else initial[m.id] = 'template';
      } else {
        initial[m.id] = 'template';
      }
    });

    setOverrides(initial);
    setSavedOverrides(initial);
  }, [selectedUser, userDetail, templateModules, rawCatalog]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    Object.keys(overrides).forEach((k) => {
      if (overrides[k] !== savedOverrides[k]) count += 1;
    });
    return count;
  }, [overrides, savedOverrides]);

  const isDirty = dirtyCount > 0;

  const handleChangeOverride = useCallback((moduleId, newMode) => {
    setOverrides((prev) => ({ ...prev, [moduleId]: newMode }));
  }, []);

  const handleCancel = useCallback(() => {
    setOverrides(savedOverrides);
  }, [savedOverrides]);

  // Save staff overrides
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      const finalModules = {};
      rawCatalog.forEach((m) => {
        const inTpl = templateModules.has(m.id);
        const mode = overrides[m.id] || 'template';
        if (mode === 'grant') finalModules[m.id] = true;
        else if (mode === 'deny') finalModules[m.id] = false;
        else finalModules[m.id] = inTpl;
      });

      return platformModuleAccessApi.updateUser(selectedUserId, {
        customAccess: true,
        modules: finalModules,
      });
    },
    onSuccess: () => {
      setSavedOverrides(overrides);
      toast.success('Xodim ruxsatlari saqlandi');
      qc.invalidateQueries({ queryKey: ['access-user-detail', selectedUserId] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Ruxsatlarni saqlashda xatolik');
    },
  });

  // Reset to template
  const resetMutation = useMutation({
    mutationFn: async (userId) => {
      return platformModuleAccessApi.resetUser(userId || selectedUserId);
    },
    onSuccess: () => {
      toast.success('Xodim rol shabloniga qaytarildi');
      qc.invalidateQueries({ queryKey: ['access-user-detail', selectedUserId] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
  });

  // Bulk reset
  const bulkResetMutation = useMutation({
    mutationFn: async (userIds) => {
      return platformModuleAccessApi.bulkReset({ userIds });
    },
    onSuccess: () => {
      toast.success('Tanlangan xodimlar shablonga qaytarildi');
      setCheckedIds(new Set());
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onStaffUpdated) onStaffUpdated();
    },
  });

  const handleToggleCheckUser = useCallback((uid, checked) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(uid);
      else next.delete(uid);
      return next;
    });
  }, []);

  const handleToggleCheckAll = useCallback((checked) => {
    if (checked) {
      setCheckedIds(new Set(users.map((u) => u.userId || u.id)));
    } else {
      setCheckedIds(new Set());
    }
  }, [users]);

  return {
    selectedUser,
    setSelectedUser,
    selectedUserId,
    overrides,
    templateModules,
    isDirty,
    dirtyCount,
    isSaving: saveMutation.isPending,
    isResetting: resetMutation.isPending,
    isResettingBulk: bulkResetMutation.isPending,
    checkedIds,
    handleChangeOverride,
    handleCancel,
    handleSave: () => saveMutation.mutate(),
    handleResetUser: (uid) => resetMutation.mutate(uid),
    handleBulkReset: () => bulkResetMutation.mutate(Array.from(checkedIds)),
    handleToggleCheckUser,
    handleToggleCheckAll,
    handleClearChecked: () => setCheckedIds(new Set()),
  };
}
