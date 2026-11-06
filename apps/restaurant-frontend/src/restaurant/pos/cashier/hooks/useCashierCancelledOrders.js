import { useQuery } from '@tanstack/react-query';
import { rstOrderApi } from '../../../api/order.api';

/**
 * Cancelled floor/waiter/cashier orders (table refusals journal).
 */
export function useCashierCancelledOrders({ storeId, enabled = true }) {
  const listQuery = useQuery({
    queryKey: ['rst-recent-cancelled', storeId],
    queryFn: () =>
      rstOrderApi.listRecentCancelled(storeId, { limit: 100 }).then((r) => r.data ?? []),
    enabled: enabled && storeId != null,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  return {
    rows: listQuery.data ?? [],
    loading: listQuery.isPending && !listQuery.data,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
  };
}
