import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api';

/**
 * Backend KPI for Super Admin stores page — avoids client-side full-table counts.
 * Note: Status is intentionally not filtered here so summary KPI cards & tabs
 * (total, active, inactive, companies) reflect platform-wide totals for the active search/filters.
 */
export function useStoresPlatformStats({
  enabled = false,
  search = '',
  businessType = '',
  regionCode = '',
  districtCode = '',
  companyId,
} = {}) {
  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
      companyId: companyId || undefined,
    }),
    [search, businessType, regionCode, districtCode, companyId]
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
