import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export const RST_STAFF_ROLES = ['WAITER', 'COOK', 'CASHIER', 'MANAGER'];
export const STAFF_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const usersQuery = useQuery({
    queryKey: ['rst-staff-users', workspace.storeId],
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
        // Only staff assigned to this restaurant store (no company-wide manager leak).
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

  const total = staff.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return staff.slice(start, start + pageSize);
  }, [staff, safePage, pageSize]);

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
    rows,
    stats,
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: (next) => setPage(Math.max(0, Math.min(next, totalPages - 1))),
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    pageSizeOptions: STAFF_PAGE_SIZE_OPTIONS,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    roleFilter,
    setRoleFilter: (value) => {
      setRoleFilter(value);
      setPage(0);
    },
    search,
    setSearch: (value) => {
      setSearch(value);
      setPage(0);
    },
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
