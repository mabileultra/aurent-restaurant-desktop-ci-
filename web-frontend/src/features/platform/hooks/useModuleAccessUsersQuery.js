import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { buildModuleAccessUsersListParams } from '../utils/moduleAccessUsersListParams';

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
  const debouncedSearch = useDebouncedValue(userSearch.trim(), 300);

  const listParams = useMemo(
    () => buildModuleAccessUsersListParams({
      companyId,
      businessType,
      search: debouncedSearch,
      userFilter,
    }),
    [companyId, businessType, debouncedSearch, userFilter]
  );

  const query = useInfiniteQuery({
    queryKey: ['platform-module-access-users', listParams],
    queryFn: ({ pageParam }) => platformModuleAccessApi
      .listUsers({ ...listParams, page: pageParam })
      .then((r) => unwrapUsersPage(r.data)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page.content?.length || 0), 0);
      if (loaded >= (lastPage.totalElements || 0)) return undefined;
      return allPages.length;
    },
  });

  const accumulated = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.content || []),
    [query.data]
  );

  const filteredUsers = useMemo(() => {
    if (canManagePlatformStaff) return accumulated;
    return accumulated.filter((user) => user.role !== 'PLATFORM_ADMIN' && user.role !== 'PLATFORM_ANALYTICS');
  }, [accumulated, canManagePlatformStaff]);

  const total = query.data?.pages?.[0]?.totalElements ?? filteredUsers.length;
  const hasMore = Boolean(query.hasNextPage);
  const loadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    query.fetchNextPage();
  };

  const unconfiguredQuery = useQuery({
    queryKey: ['platform-module-access-users', 'unconfigured-count', {
      companyId: listParams.companyId,
      platformOnly: listParams.platformOnly,
      businessType: listParams.businessType,
    }],
    queryFn: () => platformModuleAccessApi.listUsers({
      companyId: listParams.companyId,
      platformOnly: listParams.platformOnly,
      businessType: listParams.businessType,
      accessFilter: 'unconfigured',
      page: 0,
      size: 1,
    }).then((r) => unwrapUsersPage(r.data).totalElements),
  });

  return {
    filteredUsers,
    usersLoading: query.isPending,
    usersFetching: query.isFetching,
    total,
    hasMore,
    loadMore,
    usersListResetKey: `${listParams.businessType || ''}|${companyId}|${userFilter}|${debouncedSearch}`,
    unconfiguredCount: unconfiguredQuery.data ?? 0,
    refetchUsers: query.refetch,
  };
}
