import { useQuery } from '@tanstack/react-query';
import { rstOrderApi } from '../../../api/order.api';

/** Cancelled dishes journal (kitchen refuse / qty cut / table cancel). */
export function useCashierCancelledItems({ storeId, enabled = true }) {
  const listQuery = useQuery({
    queryKey: ['rst-recent-cancelled-items', storeId],
    queryFn: () =>
      rstOrderApi.listRecentCancelledItems(storeId, { limit: 150 }).then((r) => r.data ?? []),
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
