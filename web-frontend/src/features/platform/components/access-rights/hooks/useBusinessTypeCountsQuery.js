import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Barcha biznes turlaridagi xodimlar sonini orqa fonda keshlash hooki (SRP)
 */
export function useBusinessTypeCountsQuery(rawBusinessTypes = [], includePlatformStaff = false) {
  const allCodes = useMemo(() => {
    const list = rawBusinessTypes.map((b) => b.code);
    if (includePlatformStaff && !list.includes('PLATFORM_STAFF')) {
      list.push('PLATFORM_STAFF');
    }
    return list;
  }, [rawBusinessTypes, includePlatformStaff]);

  const { data: btCounts = {} } = useQuery({
    queryKey: ['access-v2-bt-counts', allCodes.join(',')],
    queryFn: async () => {
      const counts = {};
      await Promise.all(
        allCodes.map(async (code) => {
          try {
            const isPlatform = code === 'PLATFORM_STAFF';
            const res = await platformModuleAccessApi.listUsers({
              businessType: isPlatform ? undefined : code,
              platformOnly: isPlatform || undefined,
              size: 1,
            });
            counts[code] = res.data?.totalElements ?? res.data?.total ?? 0;
          } catch {
            counts[code] = 0;
          }
        })
      );
      return counts;
    },
    enabled: allCodes.length > 0,
    staleTime: 300_000,
  });

  return btCounts;
}
