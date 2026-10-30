import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { companyApi, platformBusinessTypeApi, userApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { asEntityList } from '../utils/companySelectOptions';
import { transliterateCyrillicToLatin } from '../../../utils/transliterateCyrillic';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { useUsersListQuery } from './users-list/useUsersListQuery';

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
    page: usersPage,
    isLoading,
    firstLoad,
    isRefreshing,
    isDebouncing,
    displayPage,
    isError,
    error,
    refetch,
  } = useUsersListQuery({
    isPlatform,
    tenantReady,
    tenantKey,
    page,
    pageSize,
    search,
    companyId,
    businessType,
    regionCode,
    districtCode,
    roleFilter,
    statusFilter,
    sortField,
    sortDirection,
  });

  const showRefreshingOverlay = useDelayedLoading(isRefreshing, { delay: 250, minDuration: 400 });

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform,
    staleTime: 60_000,
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: isPlatform,
  });

  const companies = useMemo(() => asEntityList(companiesRaw), [companiesRaw]);

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => {
      if (company?.id == null) return;
      map.set(String(company.id), company);
    });
    return map;
  }, [companies]);

  const pageRows = useMemo(() => (usersPage.content ?? []).map((user) => {
    const company = companyById.get(String(user.companyId ?? ''));
    const storeIds = Array.isArray(user.storeIds) ? user.storeIds : [];
    const storeNames = Array.isArray(user.storeNames) ? user.storeNames.filter(Boolean) : [];
    return {
      ...user,
      storeIds,
      storeNames,
      companyName: user.companyName || company?.name || '',
      companyLoginCode: user.companyLoginCode || company?.loginCode || '',
      regionCode: user.regionCode || company?.regionCode || '',
      districtCode: user.districtCode || company?.districtCode || '',
    };
  }), [usersPage, companyById]);

  const totalUsers = Number(usersPage.totalUsers) || 0;
  const activeUsers = Number(usersPage.activeUsers) || 0;
  const inactiveUsers = Number(usersPage.inactiveUsers) || 0;
  const adminUsers = Number(usersPage.adminUsers) || 0;
  const staffUsers = Number(usersPage.staffUsers) || 0;
  const tabTotalUsers = Number(usersPage.tabTotalUsers) || 0;
  const tabActiveUsers = Number(usersPage.tabActiveUsers) || 0;
  const tabInactiveUsers = Number(usersPage.tabInactiveUsers) || 0;
  const total = Number(usersPage.totalElements) || 0;
  const totalPages = Math.max(1, Number(usersPage.totalPages) || 1);

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

  const isAllMatchingSelected = pageRows.length > 0 && selectedUserIds.size === pageRows.length && pageRows.every((u) => selectedUserIds.has(String(u.id)));

  const handleSelectAllMatching = useCallback(() => {
    setSelectedUserIds(new Set(pageRows.map((u) => String(u.id))));
  }, [pageRows]);

  const selectedUsersList = useMemo(() => {
    if (!selectedUserIds.size) return [];
    return pageRows.filter((u) => selectedUserIds.has(String(u.id)));
  }, [pageRows, selectedUserIds]);

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
    const usersToToggle = pageRows.filter(
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
  }, [selectedUserIds, pageRows, qc, t]);

  const handleExportSelectedCsv = useCallback(() => {
    const targetUsers = pageRows.filter((u) => selectedUserIds.has(String(u.id)));
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
  }, [pageRows, selectedUserIds, t]);

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
    : t('common.systemUsers', { count: total });

  const searchSuffix = !isLoading && hasActiveFilters
    ? ` · ${t('platform.searchResults', { count: total })}`
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
    firstLoad,
    isRefreshing,
    isDebouncing,
    showRefreshingOverlay,
    displayPage,
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
