import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { useReportDateRange } from './useReportDateRange';
import { useReportStores } from './useReportStores';
import { useLiveStockRetailTotals } from './useLiveStockRetailTotals';
import { mergeDashboardLiveStock } from './mergeDashboardLiveStock';

export function useStockDashboardPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();
  const live = useLiveStockRetailTotals(storeId);

  const query = useQuery({
    queryKey: ['stock-dashboard', from, to, storeId],
    queryFn: () =>
      stockReportApi.dashboard({
        from,
        to,
        storeId: storeId === '' ? undefined : Number(storeId),
      }).then((r) => r.data),
    enabled: rangeEnabled,
  });

  const data = useMemo(
    () =>
      mergeDashboardLiveStock(query.data, {
        stockQuantityTotal: live.stockQuantityTotal,
        stockValueTotal: live.stockValueTotal,
        stockCostTotal: live.stockCostTotal,
      }),
    [query.data, live.stockQuantityTotal, live.stockValueTotal, live.stockCostTotal]
  );

  return {
    from,
    to,
    setFrom,
    setTo,
    storeId,
    setStoreId,
    stores,
    data,
    isLoading: query.isLoading || live.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
