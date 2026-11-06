import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { companyApi, platformBusinessTypeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { asEntityList } from '../utils/companySelectOptions';
import { transliterateCyrillicToLatin } from '../../../utils/transliterateCyrillic';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { useAuthStore } from '../../../store/authStore';
import { useUsersListQuery } from './users-list/useUsersListQuery';
import { useUsersBulkActions } from './users-list/useUsersBulkActions';
import { useUsersPageFilters, DEFAULT_PAGE_SIZE } from './users-list/useUsersPageFilters';
import { useUsersPageModals } from './users-list/useUsersPageModals';

export { DEFAULT_PAGE_SIZE };

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
  const { tenantKey, tenantReady } = useTenantScope();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentUsername = useAuthStore((s) => s.user?.username);

  const filters = useUsersPageFilters();
  const modals = useUsersPageModals({ t });

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
    dataUpdatedAt,
  } = useUsersListQuery({
    isPlatform,
    tenantReady,
    tenantKey,
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search,
    companyId: filters.companyId,
    businessType: filters.businessType,
    regionCode: filters.regionCode,
    districtCode: filters.districtCode,
    roleFilter: filters.roleFilter,
    statusFilter: filters.statusFilter,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
  });

  const showRefreshingOverlay = useDelayedLoading(isRefreshing, { delay: 250, minDuration: 400 });

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-options', 'users-page'],
    queryFn: async () => {
      const { data } = await companyApi.getAll({ page: 0, size: 300 });
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
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

  const bulk = useUsersBulkActions({
    pageRows,
    currentUserId,
    currentUsername,
    qc: modals.qc,
    t,
  });

  const total = Number(usersPage.totalElements) || 0;
  const totalPages = Math.max(1, Number(usersPage.totalPages) || 1);

  const subtitle = isLoading
    ? t('common.loading')
    : t('common.systemUsers', { count: total });

  return {
    t,
    isPlatform,
    currentUserId,
    currentUsername,
    ...filters,
    ...modals,
    isLoading,
    firstLoad,
    isRefreshing,
    isDebouncing,
    showRefreshingOverlay,
    displayPage,
    isError,
    error,
    refetch,
    dataUpdatedAt,
    companies,
    businessTypes,
    pageRows,
    total,
    totalPages,
    totalUsers: Number(usersPage.totalUsers) || 0,
    activeUsers: Number(usersPage.activeUsers) || 0,
    inactiveUsers: Number(usersPage.inactiveUsers) || 0,
    adminUsers: Number(usersPage.adminUsers) || 0,
    staffUsers: Number(usersPage.staffUsers) || 0,
    tabTotalUsers: Number(usersPage.tabTotalUsers) || 0,
    tabActiveUsers: Number(usersPage.tabActiveUsers) || 0,
    tabInactiveUsers: Number(usersPage.tabInactiveUsers) || 0,
    title: t('users.title'),
    subtitle,
    ...bulk,
  };
}
