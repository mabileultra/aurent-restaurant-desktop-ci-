import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import { useShouldUseOfflinePos } from '../store/connectivityStore';

/**
 * Профиль магазина для кассы. Без сети не блокирует UI бесконечным GET /stores/:id.
 */
export function useCashierStoreTypeQuery(storeId) {
  const skipOnline = useShouldUseOfflinePos();

  const query = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null && !skipOnline,
    staleTime: 60_000,
    retry: skipOnline ? false : 1,
  });

  return {
    store: query.data,
    isPending: !skipOnline && query.isPending,
    skipOnline,
    isError: query.isError,
  };
}
