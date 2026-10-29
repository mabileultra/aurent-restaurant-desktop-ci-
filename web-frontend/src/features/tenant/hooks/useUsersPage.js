import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { companyApi, platformBusinessTypeApi, storeApi, userApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { companyHasBusinessType } from '../../platform/utils/moduleAccessByBusinessType';
import { isRoleAllowedForBusinessType } from '../../platform/utils/rolesByBusinessType';
import { asEntityList } from '../utils/companySelectOptions';
import { transliterateCyrillicToLatin } from '../../../utils/transliterateCyrillic';

export const DEFAULT_PAGE_SIZE = 20;

export const MANAGEMENT_ROLES = [
  'ADMIN',
  'MANAGER',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_ANALYTICS',
];

export const STAFF_ROLES = [
  'CASHIER',
  'WAITER',
  'COOK',
  'COURIER',
  'ACCOUNTANT',
];

export function compareUserFullName(a, b, sortDirection = 'asc') {
  const cleanA = (a.fullName || '').replace(/[^\p{L}\p{N}]/gu, '').trim();
  const cleanB = (b.fullName || '').replace(/[^\p{L}\p{N}]/gu, '').trim();

  // Non-names or empty/symbol-only names always sink to the bottom in both directions
  if (!cleanA && cleanB) return 1;
  if (cleanA && !cleanB) return -1;
  if (!cleanA && !cleanB) {
    const cmpUser = (a.username || '').localeCompare(b.username || '', 'uz', { sensitivity: 'base' });
    return sortDirection === 'asc' ? cmpUser : -cmpUser;
  }

  // Transliterate full names so Cyrillic (e.g. "Азиз") and Latin (e.g. "Aziz") sort together
  const keyA = transliterateCyrillicToLatin(a.fullName || '').trim();
  const keyB = transliterateCyrillicToLatin(b.fullName || '').trim();

  const cmp = keyA.localeCompare(keyB, 'uz', { sensitivity: 'base' })
    || (a.fullName || '').localeCompare(b.fullName || '', 'uz', { sensitivity: 'base' });

  return sortDirection === 'asc' ? cmp : -cmp;
}

export function useUsersPage({ mode = 'tenant' } = {}) {
  const isPlatform = mode === 'platform';
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formMode, setFormMode] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());

  // URL-driven query states
  const search = searchParams.get('q') ?? '';
  const roleFilter = searchParams.get('role') ?? 'ALL';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const businessType = searchParams.get('businessType') ?? '';
  const companyId = searchParams.get('companyId') ?? '';
  const regionCode = searchParams.get('regionCode') ?? '';
  const districtCode = searchParams.get('districtCode') ?? '';
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.max(1, parseInt(searchParams.get('size') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE);
  const sortField = searchParams.get('sort') ?? 'fullName';
  const sortDirection = searchParams.get('dir') ?? 'asc';

  const modalOpen = formMode !== null;

  const updateParams = useCallback((mutator) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutator(next);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const {
    data: usersRaw = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: isPlatform ? ['users', 'platform'] : tenantKey('users'),
    queryFn: () => userApi.getAll().then((r) => r.data),
    enabled: isPlatform || tenantReady,
    staleTime: 60_000,
    retry: 2,
  });

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform,
    staleTime: 60_000,
  });

  const { data: storesRaw = [] } = useQuery({
    queryKey: isPlatform ? ['stores', 'platform-users'] : tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data ?? []),
    enabled: isPlatform || tenantReady,
    staleTime: 60_000,
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: isPlatform,
  });

  const users = useMemo(() => asEntityList(usersRaw), [usersRaw]);
  const companies = useMemo(() => asEntityList(companiesRaw), [companiesRaw]);
  const stores = useMemo(() => asEntityList(storesRaw), [storesRaw]);

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => {
      if (company?.id == null) return;
      map.set(String(company.id), company);
    });
    return map;
  }, [companies]);

  const storeById = useMemo(() => {
    const map = new Map();
    stores.forEach((store) => {
      if (store?.id == null) return;
      map.set(String(store.id), store);
    });
    return map;
  }, [stores]);

  const displayUsers = useMemo(() => users.map((user) => {
    const company = companyById.get(String(user.companyId ?? ''));
    const rawStoreIds = Array.isArray(user.storeIds)
      ? user.storeIds
      : Array.isArray(user.stores)
        ? user.stores.map((s) => (s && typeof s === 'object' ? s.id : s))
        : (user.storeId != null ? [user.storeId] : []);
    const fromApiNames = Array.isArray(user.storeNames)
      ? user.storeNames.filter(Boolean)
      : [];
    const fromIds = rawStoreIds
      .map((id) => storeById.get(String(id))?.name)
      .filter(Boolean);
    const storeNames = fromApiNames.length ? fromApiNames : fromIds;
    return {
      ...user,
      storeIds: rawStoreIds,
      companyName: user.companyName || company?.name || '',
      companyLoginCode: user.companyLoginCode || company?.loginCode || '',
      regionCode: company?.regionCode || '',
      districtCode: company?.districtCode || '',
      storeNames,
    };
  }), [users, companyById, storeById]);

  // Scoped context users (filtered by company, business type, region, search)
  const contextUsers = useMemo(() => {
    const rawQ = search.trim().toLowerCase();
    const latinQ = rawQ ? transliterateCyrillicToLatin(rawQ).toLowerCase() : '';

    return displayUsers.filter((user) => {
      if (businessType) {
        const company = companyById.get(String(user.companyId ?? ''));
        if (!companyHasBusinessType(company, businessType)) return false;
        if (!isRoleAllowedForBusinessType(user.role, businessType)) return false;
      }

      if (companyId && String(user.companyId ?? '') !== String(companyId)) return false;
      if (regionCode && String(user.regionCode || '') !== regionCode) return false;
      if (districtCode && String(user.districtCode || '') !== districtCode) return false;

      if (!rawQ) return true;

      const haystack = [
        user.fullName,
        user.username,
        user.email,
        user.phone,
        user.role,
        user.companyName,
        user.companyLoginCode,
        ...(user.storeNames ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(rawQ) || (latinQ && haystack.includes(latinQ));
    });
  }, [displayUsers, search, businessType, companyId, regionCode, districtCode, companyById]);

  // Synchronized counts reflecting active scope
  const totalUsers = contextUsers.length;
  const activeUsers = useMemo(() => contextUsers.filter((u) => u.active).length, [contextUsers]);
  const inactiveUsers = useMemo(() => contextUsers.filter((u) => !u.active).length, [contextUsers]);
  const adminUsers = useMemo(() => contextUsers.filter((u) => MANAGEMENT_ROLES.includes(u.role)).length, [contextUsers]);
  const staffUsers = useMemo(() => contextUsers.filter((u) => STAFF_ROLES.includes(u.role)).length, [contextUsers]);

  // Counts for the segmented status tabs (Barchasi / Faol / Nofaol), respecting the active role filter
  const roleScopedUsers = useMemo(() => {
    if (!roleFilter || roleFilter === 'ALL') return contextUsers;
    return contextUsers.filter((user) => {
      if (roleFilter === 'MANAGEMENT') {
        return MANAGEMENT_ROLES.includes(user.role);
      }
      if (roleFilter === 'STAFF') {
        return STAFF_ROLES.includes(user.role);
      }
      return user.role === roleFilter;
    });
  }, [contextUsers, roleFilter]);

  const tabTotalUsers = roleScopedUsers.length;
  const tabActiveUsers = useMemo(() => roleScopedUsers.filter((u) => u.active).length, [roleScopedUsers]);
  const tabInactiveUsers = useMemo(() => roleScopedUsers.filter((u) => !u.active).length, [roleScopedUsers]);

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updated'));
      setMenuId(null);
    },
  });

  const { mutate: deleteUser, isPending: isDeletePending } = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.deleted'));
      setDeleteTarget(null);
      setMenuId(null);
      setDrawerUser(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('users.deleteFailed'));
    },
  });

  const filteredUsers = useMemo(() => {
    return contextUsers.filter((user) => {
      if (statusFilter === 'ACTIVE' && !user.active) return false;
      if (statusFilter === 'INACTIVE' && user.active) return false;

      if (roleFilter && roleFilter !== 'ALL') {
        if (roleFilter === 'MANAGEMENT') {
          if (!MANAGEMENT_ROLES.includes(user.role)) return false;
        } else if (roleFilter === 'STAFF') {
          if (!STAFF_ROLES.includes(user.role)) return false;
        } else if (user.role !== roleFilter) {
          return false;
        }
      }

      return true;
    });
  }, [contextUsers, statusFilter, roleFilter]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    if (!sortField) return list;

    list.sort((a, b) => {
      if (sortField === 'fullName') {
        return compareUserFullName(a, b, sortDirection);
      }

      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'company') {
        valA = a.companyName || '';
        valB = b.companyName || '';
      } else if (sortField === 'role') {
        valA = a.role || '';
        valB = b.role || '';
      } else if (sortField === 'status') {
        valA = a.active ? 1 : 0;
        valB = b.active ? 1 : 0;
      } else if (sortField === 'createdAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }

      const cmp = String(valA ?? '').localeCompare(String(valB ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [filteredUsers, sortField, sortDirection]);

  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  const setPage = useCallback((nextPage) => {
    updateParams((p) => {
      const target = typeof nextPage === 'function' ? nextPage(page) : nextPage;
      if (target <= 0) p.delete('page');
      else p.set('page', String(target));
    });
  }, [page, updateParams]);

  const handlePageSizeChange = useCallback((nextSize) => {
    updateParams((p) => {
      p.set('size', String(nextSize));
      p.delete('page');
    });
  }, [updateParams]);

  const handleSearchChange = useCallback((value) => {
    updateParams((p) => {
      if (value) p.set('q', value);
      else p.delete('q');
      p.delete('page');
    });
  }, [updateParams]);

  const handleBusinessTypeChange = useCallback((code) => {
    updateParams((p) => {
      if (code) p.set('businessType', code);
      else p.delete('businessType');
      p.delete('page');
    });
  }, [updateParams]);

  const handleCompanyChange = useCallback((id) => {
    updateParams((p) => {
      if (id) p.set('companyId', String(id));
      else p.delete('companyId');
      p.delete('page');
    });
  }, [updateParams]);

  const handleGeoChange = useCallback(({ regionCode: r, districtCode: d }) => {
    updateParams((p) => {
      if (r) p.set('regionCode', r);
      else p.delete('regionCode');
      if (d) p.set('districtCode', d);
      else p.delete('districtCode');
      p.delete('page');
    });
  }, [updateParams]);

  const handleRoleFilterChange = useCallback((role) => {
    updateParams((p) => {
      if (role && role !== 'ALL') p.set('role', role);
      else p.delete('role');
      p.delete('page');
    });
  }, [updateParams]);

  const handleStatusFilterChange = useCallback((status) => {
    updateParams((p) => {
      if (status && status !== 'ALL') p.set('status', status);
      else p.delete('status');
      p.delete('page');
    });
  }, [updateParams]);

  const handleSort = useCallback((field) => {
    updateParams((p) => {
      if (sortField === field) {
        p.set('dir', sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        p.set('sort', field);
        p.set('dir', 'asc');
      }
    });
  }, [sortField, sortDirection, updateParams]);

  const handleResetFilters = useCallback(() => {
    updateParams((p) => {
      p.delete('q');
      p.delete('role');
      p.delete('status');
      p.delete('businessType');
      p.delete('companyId');
      p.delete('regionCode');
      p.delete('districtCode');
      p.delete('page');
    });
  }, [updateParams]);

  // Bulk actions
  const handleToggleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedUserIds(new Set(pageRows.map((u) => String(u.id))));
    } else {
      setSelectedUserIds(new Set());
    }
  }, [pageRows]);

  const handleToggleSelectUser = useCallback((id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      const str = String(id);
      if (next.has(str)) next.delete(str);
      else next.add(str);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
  }, []);

  const isAllMatchingSelected = sortedUsers.length > 0 && selectedUserIds.size === sortedUsers.length && sortedUsers.every((u) => selectedUserIds.has(String(u.id)));

  const handleSelectAllMatching = useCallback(() => {
    setSelectedUserIds(new Set(sortedUsers.map((u) => String(u.id))));
  }, [sortedUsers]);

  const selectedUsersList = useMemo(() => {
    if (!selectedUserIds.size) return [];
    return sortedUsers.filter((u) => selectedUserIds.has(String(u.id)));
  }, [sortedUsers, selectedUserIds]);

  const hasInactiveSelected = useMemo(
    () => selectedUsersList.some((u) => !u.active),
    [selectedUsersList]
  );
  const hasActiveSelected = useMemo(
    () => selectedUsersList.some((u) => u.active),
    [selectedUsersList]
  );

  const handleBulkToggleActive = useCallback(async (targetActive) => {
    const ids = Array.from(selectedUserIds);
    if (!ids.length) return;
    const usersToToggle = sortedUsers.filter(
      (u) => selectedUserIds.has(String(u.id)) && Boolean(u.active) !== Boolean(targetActive)
    );
    if (!usersToToggle.length) {
      toast.success(t('users.bulkAlreadyInState', { defaultValue: 'Tanlangan barcha foydalanuvchilar allaqachon ushbu holatda' }));
      setSelectedUserIds(new Set());
      return;
    }
    try {
      await Promise.all(usersToToggle.map((u) => userApi.toggle(u.id)));
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.bulkUpdated', { count: usersToToggle.length, defaultValue: `${usersToToggle.length} ta foydalanuvchi holati yangilandi` }));
      setSelectedUserIds(new Set());
    } catch {
      toast.error(t('users.bulkUpdateFailed', { defaultValue: 'Ommaviy yangilashda xatolik yuz berdi' }));
    }
  }, [selectedUserIds, sortedUsers, qc, t]);

  const handleExportSelectedCsv = useCallback(() => {
    const targetUsers = sortedUsers.filter((u) => selectedUserIds.has(String(u.id)));
    if (!targetUsers.length) return;

    const headers = ['ID', 'FIO', 'Login', 'Telefon', 'Email', 'Rol', 'Kompaniya', 'Filiallar', 'Holat', 'Yaratilgan'];
    const rows = targetUsers.map((u) => {
      let safeDate = '';
      if (u.createdAt) {
        try {
          const d = new Date(u.createdAt);
          if (!Number.isNaN(d.getTime())) {
            safeDate = d.toISOString();
          }
        } catch {
          safeDate = '';
        }
      }
      return [
        u.id,
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        `"${u.username || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.email || ''}"`,
        `"${u.role || ''}"`,
        `"${(u.companyName || '').replace(/"/g, '""')}"`,
        `"${(u.storeNames || []).join(', ').replace(/"/g, '""')}"`,
        u.active ? 'Faol' : 'Nofaol',
        safeDate,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('users.csvExported', { count: targetUsers.length, defaultValue: `${targetUsers.length} ta foydalanuvchi CSV formatida yuklab olindi` }));
  }, [sortedUsers, selectedUserIds, t]);

  const openCreate = () => setFormMode('create');
  const openEdit = (user) => setFormMode({ type: 'edit', user });
  const closeModal = () => setFormMode(null);

  const openDelete = (user) => setDeleteTarget(user);
  const closeDelete = () => setDeleteTarget(null);

  const confirmDelete = () => {
    if (deleteTarget?.id) deleteUser(deleteTarget.id);
  };

  const openDrawer = (user) => setDrawerUser(user);
  const closeDrawer = () => setDrawerUser(null);

  const hasActiveFilters = Boolean(
    search.trim()
    || (roleFilter && roleFilter !== 'ALL')
    || (statusFilter && statusFilter !== 'ALL')
    || businessType
    || companyId
    || regionCode
    || districtCode
  );

  const hasContextFilters = Boolean(
    search.trim()
    || businessType
    || companyId
    || regionCode
    || districtCode
  );

  const subtitle = isLoading
    ? t('common.loading')
    : t('common.systemUsers', { count: users.length });

  const searchSuffix = !isLoading && hasActiveFilters
    ? ` · ${t('platform.searchResults', { count: sortedUsers.length })}`
    : '';

  return {
    t,
    isPlatform,
    formMode,
    modalOpen,
    menuId,
    setMenuId,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    search,
    businessType,
    businessTypes,
    companies,
    companyId,
    regionCode,
    districtCode,
    roleFilter,
    setRoleFilter: handleRoleFilterChange,
    handleRoleFilterChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    handleStatusFilterChange,
    sortField,
    sortDirection,
    handleSort,
    handleResetFilters,
    drawerUser,
    openDrawer,
    closeDrawer,
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    staffUsers,
    tabTotalUsers,
    tabActiveUsers,
    tabInactiveUsers,
    isLoading,
    isError,
    error,
    refetch,
    pageRows,
    total,
    totalPages,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    handleBusinessTypeChange,
    handleCompanyChange,
    handleGeoChange,
    companyById,
    toggleUser,
    deleteTarget,
    openDelete,
    closeDelete,
    confirmDelete,
    isDeletePending,
    hasActiveFilters,
    hasContextFilters,
    selectedUserIds,
    handleToggleSelectAll,
    handleToggleSelectUser,
    handleClearSelection,
    handleSelectAllMatching,
    isAllMatchingSelected,
    hasInactiveSelected,
    hasActiveSelected,
    handleBulkToggleActive,
    handleExportSelectedCsv,
    subtitle: `${subtitle}${searchSuffix}`,
    title: isPlatform ? t('platform.usersTitle') : t('users.title'),
    editingUser: formMode?.type === 'edit' ? formMode.user : undefined,
    modalMode: formMode === 'create' ? 'create' : 'edit',
  };
}
