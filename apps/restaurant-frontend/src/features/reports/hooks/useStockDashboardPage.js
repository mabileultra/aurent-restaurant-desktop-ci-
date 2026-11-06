import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { useReportDateRange } from './useReportDateRange';
import { useReportStores } from './useReportStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';

export function useStockDashboardPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const workspace = useRestaurantWorkspaceStore();
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  useEffect(() => {
    if (workspace.storeId != null) setStoreId(String(workspace.storeId));
  }, [workspace.storeId]);

  const query = useQuery({
    queryKey: ['stock-dashboard', from, to, storeId],
    queryFn: () =>
      stockReportApi
        .dashboard({
          from,
          to,
          storeId: storeId === '' ? undefined : Number(storeId),
        })
        .then((r) => r.data),
    enabled: rangeEnabled,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    storeId,
    setStoreId,
    stores,
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
