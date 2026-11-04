import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Server aggregates for Access V2 pills/cards (businessType + role headcounts).
 */
export function useAccessRightsStats() {
  const query = useQuery({
    queryKey: ['platform-module-access-stats'],
    queryFn: () => platformModuleAccessApi.stats().then((r) => r.data || { businessTypes: [] }),
    staleTime: 60_000,
  });

  const byCode = useMemo(() => {
    const map = new Map();
    const rows = query.data?.businessTypes || [];
    for (const row of rows) {
      if (!row?.code) continue;
      const roleMap = new Map();
      for (const role of row.roles || []) {
        if (!role?.role) continue;
        roleMap.set(String(role.role).toUpperCase(), role);
      }
      map.set(String(row.code).toUpperCase(), { ...row, roleMap });
    }
    return map;
  }, [query.data]);

  return {
    statsByCode: byCode,
    statsLoading: query.isLoading,
    refetchStats: query.refetch,
  };
}
