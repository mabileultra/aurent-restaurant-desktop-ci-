import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api';

/**
 * Backend KPI for Super Admin stores page — avoids client-side full-table counts.
 */
export function useStoresPlatformStats({
  enabled = false,
  search = '',
  statusFilter = 'ALL',
  businessType = '',
  regionCode = '',
  companyId,
} = {}) {
  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      companyId: companyId || undefined,
    }),
    [search, statusFilter, businessType, regionCode, companyId]
  );

  const query = useQuery({
    queryKey: ['stores-stats', params],
    queryFn: () => storeApi.getStats(params).then((r) => r.data),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    stats: query.data ?? null,
    isStatsPending: query.isPending && !query.data,
    refetchStats: query.refetch,
  };
}
