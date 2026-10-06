import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { platformAnalyticsApi } from '../../../api';
import { mapPlatformAnalyticsSales } from '../utils/mapPlatformAnalyticsSales';

export function usePlatformAnalyticsSales() {
  const [period, setPeriod] = useState('7d');

  const query = useQuery({
    queryKey: ['platform-analytics-sales', period],
    queryFn: () => platformAnalyticsApi.sales({ period }).then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  const data = useMemo(() => {
    if (!query.data) return null;
    return mapPlatformAnalyticsSales(query.data, period);
  }, [period, query.data]);

  return {
    period,
    setPeriod,
    data,
    loading: query.isLoading || (query.isFetching && !query.data),
    error: query.error,
    isLive: Boolean(query.data),
  };
}
