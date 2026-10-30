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

  const query = useQuery({
    queryKey: [...(isPlatform ? ['users', 'platform'] : tenantKey('users')), params],
    queryFn: () => userApi.listManaged(params).then((response) => response.data),
    enabled: isPlatform || tenantReady,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 2,
  });

  const isDebouncing = Boolean(search && search !== debouncedSearch);
  const firstLoad = query.isPending && !query.data;
  const isRefreshing = (query.isFetching && !firstLoad) || isDebouncing;
  const displayPage = typeof query.data?.number === 'number' ? query.data.number : page;

  return {
    page: query.data ?? EMPTY_PAGE,
    isLoading: firstLoad,
    firstLoad,
    isRefreshing,
    isFetching: query.isFetching,
    isDebouncing,
    displayPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
