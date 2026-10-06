import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { platformAnalyticsApi } from '../../../api';
import { mapPlatformAnalyticsStores } from '../utils/mapPlatformAnalyticsStores';

export function usePlatformAnalyticsStores() {
  const [period, setPeriod] = useState('7d');

  const query = useQuery({
    queryKey: ['platform-analytics-stores', period],
    queryFn: () => platformAnalyticsApi.stores({ period }).then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  const data = useMemo(() => {
    if (!query.data) return null;
    return mapPlatformAnalyticsStores(query.data, period);
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
