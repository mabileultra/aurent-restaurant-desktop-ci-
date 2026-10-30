import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { MODULE_ACCESS_PLATFORM_FILTER } from '../constants';
import { MODULE_ACCESS_USERS_PAGE_SIZE } from '../components/module-access/users/PlatformModuleAccessUsersList';

function unwrapUsersPage(data) {
  if (Array.isArray(data)) {
    return { content: data, totalElements: data.length, totalPages: 1, number: 0 };
  }
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Number(data?.totalPages) || 0,
    number: Number(data?.number) || 0,
  };
}

export function useModuleAccessUsersQuery({
  companyId,
  businessType,
  userSearch,
  userFilter,
  canManagePlatformStaff,
}) {
  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState([]);
  const debouncedSearch = useDebouncedValue(userSearch.trim(), 300);

  const platformOnly = companyId === MODULE_ACCESS_PLATFORM_FILTER;
  const numericCompanyId = platformOnly || !companyId ? undefined : Number(companyId);

  const params = useMemo(() => ({
    companyId: Number.isFinite(numericCompanyId) ? numericCompanyId : undefined,
    platformOnly: platformOnly || undefined,
    search: debouncedSearch || undefined,
    accessFilter: userFilter && userFilter !== 'all' ? userFilter : undefined,
    businessType: !platformOnly && !numericCompanyId && businessType ? businessType : undefined,
    page,
    size: MODULE_ACCESS_USERS_PAGE_SIZE,
  }), [numericCompanyId, platformOnly, debouncedSearch, userFilter, businessType, page]);

  useEffect(() => {
    setPage(0);
    setAccumulated([]);
  }, [numericCompanyId, platformOnly, debouncedSearch, userFilter, businessType]);

  const query = useQuery({
    queryKey: ['platform-module-access-users', params],
    queryFn: () => platformModuleAccessApi.listUsers(params).then((r) => unwrapUsersPage(r.data)),
  });

  useEffect(() => {
    const content = query.data?.content;
    if (!content) return;
    setAccumulated((prev) => (page === 0 ? content : [...prev, ...content]));
  }, [query.data, page]);

  const filteredUsers = useMemo(() => {
    if (canManagePlatformStaff) return accumulated;
    return accumulated.filter((user) => user.role !== 'PLATFORM_ADMIN' && user.role !== 'PLATFORM_ANALYTICS');
  }, [accumulated, canManagePlatformStaff]);

  const total = query.data?.totalElements ?? filteredUsers.length;
  const hasMore = accumulated.length < total;
  const loadMore = () => {
    if (!hasMore || query.isFetching) return;
    setPage((p) => p + 1);
  };

  const unconfiguredQuery = useQuery({
    queryKey: ['platform-module-access-users', 'unconfigured-count', {
      companyId: params.companyId,
      platformOnly: params.platformOnly,
      businessType: params.businessType,
    }],
    queryFn: () => platformModuleAccessApi.listUsers({
      companyId: params.companyId,
      platformOnly: params.platformOnly,
      businessType: params.businessType,
      accessFilter: 'unconfigured',
      page: 0,
      size: 1,
    }).then((r) => unwrapUsersPage(r.data).totalElements),
  });

  return {
    filteredUsers,
    usersLoading: query.isPending && page === 0,
    usersFetching: query.isFetching,
    total,
    hasMore,
    loadMore,
    usersListResetKey: `${businessType}|${companyId}|${userFilter}|${debouncedSearch}`,
    unconfiguredCount: unconfiguredQuery.data ?? 0,
    refetchUsers: query.refetch,
  };
}
