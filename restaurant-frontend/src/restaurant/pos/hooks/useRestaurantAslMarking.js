import { useQuery } from '@tanstack/react-query';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';

export function useRestaurantAslMarking(storeId) {
  const query = useQuery({
    queryKey: ['pharmacy-integration', storeId],
    queryFn: () => pharmacyIntegrationApi.getCashierCapabilities(storeId).then((r) => r.data),
    enabled: Boolean(storeId),
    staleTime: 60_000,
    retry: 1,
  });

  const resolveEnabled = async () => {
    if (query.isFetched) return Boolean(query.data?.aslMarkingEnabled);
    const result = await query.refetch();
    return Boolean(result.data?.aslMarkingEnabled);
  };

  return {
    aslMarkingEnabled: Boolean(query.data?.aslMarkingEnabled),
    aslReady: query.isFetched,
    resolveEnabled,
  };
}
