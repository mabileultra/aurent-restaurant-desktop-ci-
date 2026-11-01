import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Faol bo'lmagan biznes turlaridagi xodimlar sonini orqa fonda keshlash hooki (SRP)
 */
export function useBusinessTypeCountsQuery(rawBusinessTypes = [], selectedBT) {
  const { data: btCounts = {} } = useQuery({
    queryKey: ['access-v2-bt-counts', rawBusinessTypes.map((b) => b.code).join(',')],
    queryFn: async () => {
      const counts = {};
      const otherTypes = rawBusinessTypes.filter((b) => b.code !== selectedBT);
      await Promise.all(
        otherTypes.map(async (bt) => {
          try {
            const res = await platformModuleAccessApi.listUsers({ businessType: bt.code, size: 1 });
            counts[bt.code] = res.data?.totalElements ?? res.data?.total ?? 0;
          } catch {
            counts[bt.code] = 0;
          }
        })
      );
      return counts;
    },
    enabled: rawBusinessTypes.length > 0,
    staleTime: Infinity,
  });

  return btCounts;
}
