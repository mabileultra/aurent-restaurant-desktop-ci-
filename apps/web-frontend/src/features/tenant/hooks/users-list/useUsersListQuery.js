import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { userApi } from '../../../../api';
import { buildUsersListParams } from './buildUsersListParams';

const EMPTY_PAGE = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  adminUsers: 0,
  staffUsers: 0,
  tabTotalUsers: 0,
  tabActiveUsers: 0,
  tabInactiveUsers: 0,
};

export function normalizeUsersPage(data) {
  if (!data) return EMPTY_PAGE;
  if (Array.isArray(data)) {
    const activeCount = data.filter((u) => u.active).length;
    const adminCount = data.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      totalUsers: data.length,
      activeUsers: activeCount,
      inactiveUsers: data.length - activeCount,
      adminUsers: adminCount,
      staffUsers: data.length - adminCount,
      tabTotalUsers: data.length,
      tabActiveUsers: activeCount,
      tabInactiveUsers: data.length - activeCount,
    };
  }
  const content = Array.isArray(data.content) ? data.content : [];
  const totalElements = Number(data.totalElements) || content.length;
  const totalUsers = typeof data.totalUsers === 'number' ? data.totalUsers : totalElements;
  const activeUsers = typeof data.activeUsers === 'number'
    ? data.activeUsers
    : content.filter((u) => u.active).length;
  const inactiveUsers = typeof data.inactiveUsers === 'number'
    ? data.inactiveUsers
    : Math.max(0, totalUsers - activeUsers);
  const adminUsers = typeof data.adminUsers === 'number'
    ? data.adminUsers
    : content.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
  const staffUsers = typeof data.staffUsers === 'number'
    ? data.staffUsers
    : Math.max(0, totalUsers - adminUsers);

  return {
    ...data,
    content,
    totalElements,
    totalPages: Math.max(1, Number(data.totalPages) || Math.ceil(totalElements / (data.size || 20)) || 1),
    number: Number(data.number) || 0,
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    staffUsers,
    tabTotalUsers: typeof data.tabTotalUsers === 'number' ? data.tabTotalUsers : totalUsers,
    tabActiveUsers: typeof data.tabActiveUsers === 'number' ? data.tabActiveUsers : activeUsers,
    tabInactiveUsers: typeof data.tabInactiveUsers === 'number' ? data.tabInactiveUsers : inactiveUsers,
  };
}

export function useUsersListQuery({
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
}) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => buildUsersListParams({
    page,
    pageSize,
    search: debouncedSearch,
    companyId,
    businessType,
    regionCode,
    districtCode,
    roleFilter,
    statusFilter,
    sortField,
    sortDirection,
  }), [
    page,
    pageSize,
    debouncedSearch,
    companyId,
    businessType,
    regionCode,
    districtCode,
    roleFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  const isQueryEnabled = Boolean(isPlatform || tenantReady);

  const query = useQuery({
    queryKey: [...(isPlatform ? ['users', 'platform'] : tenantKey('users')), params],
    queryFn: () => userApi.listManaged(params).then((response) => response.data),
    enabled: isQueryEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 2,
  });

  const isDebouncing = Boolean(search && search !== debouncedSearch);
  const firstLoad = isQueryEnabled && query.isLoading;
  const isRefreshing = (query.isFetching && !firstLoad) || isDebouncing;
  const displayPage = typeof query.data?.number === 'number' ? query.data.number : page;

  return {
    page: normalizeUsersPage(query.data),
    isLoading: firstLoad,
    firstLoad,
    isRefreshing,
    isFetching: query.isFetching,
    isDebouncing,
    displayPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
