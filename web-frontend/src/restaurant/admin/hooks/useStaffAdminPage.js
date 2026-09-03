import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export const RST_STAFF_ROLES = ['WAITER', 'COOK', 'CASHIER', 'MANAGER'];

function userStoreIds(user) {
  if (Array.isArray(user.storeIds)) return user.storeIds.map(Number);
  if (Array.isArray(user.stores)) {
    return user.stores.map((s) => Number(s && typeof s === 'object' ? s.id : s));
  }
  return [];
}

export function useStaffAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const authRole = useAuthStore((s) => s.user?.role);
  const canManage = authRole === 'ADMIN' || authRole === 'SUPER_ADMIN';
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const usersQuery = useQuery({
    queryKey: ['rst-staff-users'],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
  });

  const staff = useMemo(() => {
    const storeId = workspace.storeId;
    if (storeId == null) return [];
    const q = search.trim().toLowerCase();
    return (usersQuery.data ?? [])
      .filter((user) => RST_STAFF_ROLES.includes(user.role))
      .filter((user) => {
        const ids = userStoreIds(user);
        if (user.role === 'MANAGER' && ids.length === 0) return true;
        return ids.includes(Number(storeId));
      })
      .filter((user) => !roleFilter || user.role === roleFilter)
      .filter((user) => {
        if (!q) return true;
        const name = `${user.fullName || ''} ${user.firstName || ''} ${user.lastName || ''} ${user.username || ''}`.toLowerCase();
        return name.includes(q);
      })
      .sort((a, b) => String(a.fullName || a.username).localeCompare(String(b.fullName || b.username)));
  }, [usersQuery.data, workspace.storeId, roleFilter, search]);

  const stats = useMemo(() => ({
    total: staff.length,
    waiters: staff.filter((u) => u.role === 'WAITER').length,
    cooks: staff.filter((u) => u.role === 'COOK').length,
    cashiers: staff.filter((u) => u.role === 'CASHIER').length,
    managers: staff.filter((u) => u.role === 'MANAGER').length,
    active: staff.filter((u) => u.active !== false).length,
  }), [staff]);

  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      toast.success(t('rst.staff.toggled'));
      qc.invalidateQueries({ queryKey: ['rst-staff-users'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.staff.toggleFailed')),
  });

  const displayName = (user) => (
    user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || '—'
  );

  return {
    t,
    workspace,
    canManage,
    staff,
    stats,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    formMode,
    editingUser,
    openCreate: () => {
      if (!canManage) {
        toast.error(t('rst.staff.adminOnly'));
        return;
      }
      setEditingUser(null);
      setFormMode('create');
    },
    openEdit: (user) => {
      if (!canManage) {
        toast.error(t('rst.staff.adminOnly'));
        return;
      }
      setEditingUser(user);
      setFormMode('edit');
    },
    closeForm: () => {
      setFormMode(null);
      setEditingUser(null);
      qc.invalidateQueries({ queryKey: ['rst-staff-users'] });
    },
    toggleMutation,
    displayName,
  };
}
