import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { platformAnalyticsApi } from '../../../api';
import { buildAnalyticsOverviewDemo } from '../utils/analyticsOverviewDemo';
import { mapPlatformAnalyticsOverview } from '../utils/mapPlatformAnalyticsOverview';

export function usePlatformAnalyticsOverview() {
  const [period, setPeriod] = useState('7d');

  const query = useQuery({
    queryKey: ['platform-analytics-overview', period],
    queryFn: () => platformAnalyticsApi.overview({ period }).then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  const data = useMemo(() => {
    if (query.data) {
      return mapPlatformAnalyticsOverview(query.data, period);
    }
    if (query.isLoading || query.isFetching) {
      return null;
    }
    return buildAnalyticsOverviewDemo(period);
  }, [period, query.data, query.isFetching, query.isLoading]);

  return {
    period,
    setPeriod,
    data,
    loading: query.isLoading || (query.isFetching && !query.data),
    error: query.error,
    isLive: Boolean(query.data) && query.data.demo !== true,
    refetch: query.refetch,
  };
}
