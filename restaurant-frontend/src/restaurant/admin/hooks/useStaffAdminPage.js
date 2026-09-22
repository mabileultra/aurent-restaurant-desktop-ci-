import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { rstCommissionApi } from '../../api/commission.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

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

function toPercentInput(value) {
  if (value == null || value === '') return '0';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '0';
}

export function useStaffAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const authRole = useAuthStore((s) => s.user?.role);
  const canManage = authRole === 'ADMIN' || authRole === 'SUPER_ADMIN';
  const canEditCommission = canManage || authRole === 'MANAGER';
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [defaultPercentDraft, setDefaultPercentDraft] = useState(null);
  const [waiterDrafts, setWaiterDrafts] = useState({});

  const usersQuery = useQuery({
    queryKey: ['rst-staff-users', workspace.storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
  });

  const commissionQuery = useQuery({
    queryKey: ['rst-waiter-commission', workspace.storeId],
    queryFn: () => rstCommissionApi.getSettings(workspace.storeId).then((r) => r.data),
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

  const overrideMap = useMemo(() => {
    const map = new Map();
    for (const row of commissionQuery.data?.overrides ?? []) {
      map.set(String(row.userId), Number(row.percent));
    }
    return map;
  }, [commissionQuery.data]);

  const defaultPercent = Number(commissionQuery.data?.defaultPercent ?? 0);
  const loadedDefault = toPercentInput(commissionQuery.data?.defaultPercent ?? 0);

  const waiterRate = (userId) => {
    const key = String(userId);
    if (overrideMap.has(key)) {
      return { percent: overrideMap.get(key), custom: true };
    }
    return { percent: defaultPercent, custom: false };
  };

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

  const invalidateCommission = () => {
    qc.invalidateQueries({ queryKey: ['rst-waiter-commission', workspace.storeId] });
  };

  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      toast.success(t('rst.staff.toggled'));
      qc.invalidateQueries({ queryKey: ['rst-staff-users'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toastApiError(err, t('rst.staff.toggleFailed')),
  });

  const saveDefaultMutation = useMutation({
    mutationFn: (percent) => rstCommissionApi.setDefault(workspace.storeId, percent),
    onSuccess: () => {
      toast.success(t('rst.staff.commissionSaved'));
      setDefaultPercentDraft(null);
      invalidateCommission();
    },
    onError: (err) => toastApiError(err, t('rst.staff.commissionSaveFailed')),
  });

  const applyAllMutation = useMutation({
    mutationFn: (percent) => rstCommissionApi.applyAll(workspace.storeId, percent),
    onSuccess: () => {
      toast.success(t('rst.staff.commissionAppliedAll'));
      setDefaultPercentDraft(null);
      setWaiterDrafts({});
      invalidateCommission();
    },
    onError: (err) => toastApiError(err, t('rst.staff.commissionSaveFailed')),
  });

  const saveWaiterMutation = useMutation({
    mutationFn: ({ userId, percent }) => rstCommissionApi.setWaiter(workspace.storeId, userId, percent),
    onSuccess: (_data, vars) => {
      toast.success(t('rst.staff.commissionSaved'));
      setWaiterDrafts((prev) => {
        const next = { ...prev };
        delete next[String(vars.userId)];
        return next;
      });
      invalidateCommission();
    },
    onError: (err) => toastApiError(err, t('rst.staff.commissionSaveFailed')),
  });

  const clearWaiterMutation = useMutation({
    mutationFn: (userId) => rstCommissionApi.clearWaiter(workspace.storeId, userId),
    onSuccess: (_data, userId) => {
      toast.success(t('rst.staff.commissionCleared'));
      setWaiterDrafts((prev) => {
        const next = { ...prev };
        delete next[String(userId)];
        return next;
      });
      invalidateCommission();
    },
    onError: (err) => toastApiError(err, t('rst.staff.commissionSaveFailed')),
  });

  const displayName = (user) => (
    user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || '—'
  );

  const parsePercent = (raw) => {
    const n = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.error(t('rst.staff.commissionInvalid'));
      return null;
    }
    return Math.round(n * 100) / 100;
  };

  const draftDefault = defaultPercentDraft ?? loadedDefault;

  return {
    t,
    workspace,
    canManage,
    canEditCommission,
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
    commissionLoading: commissionQuery.isLoading,
    defaultPercent,
    draftDefault,
    setDefaultPercentDraft,
    waiterRate,
    waiterDraft: (userId) => {
      const key = String(userId);
      if (Object.prototype.hasOwnProperty.call(waiterDrafts, key)) return waiterDrafts[key];
      return toPercentInput(waiterRate(userId).percent);
    },
    setWaiterDraft: (userId, value) => {
      setWaiterDrafts((prev) => ({ ...prev, [String(userId)]: value }));
    },
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
    saveDefault: () => {
      const percent = parsePercent(draftDefault);
      if (percent == null) return;
      saveDefaultMutation.mutate(percent);
    },
    applyAll: () => {
      const percent = parsePercent(draftDefault);
      if (percent == null) return;
      if (!window.confirm(t('rst.staff.commissionApplyAllConfirm', { percent }))) return;
      applyAllMutation.mutate(percent);
    },
    saveWaiterPercent: (userId) => {
      const percent = parsePercent(
        Object.prototype.hasOwnProperty.call(waiterDrafts, String(userId))
          ? waiterDrafts[String(userId)]
          : toPercentInput(waiterRate(userId).percent),
      );
      if (percent == null) return;
      saveWaiterMutation.mutate({ userId, percent });
    },
    clearWaiterPercent: (userId) => clearWaiterMutation.mutate(userId),
    commissionBusy:
      saveDefaultMutation.isPending
      || applyAllMutation.isPending
      || saveWaiterMutation.isPending
      || clearWaiterMutation.isPending,
    displayName,
  };
}
