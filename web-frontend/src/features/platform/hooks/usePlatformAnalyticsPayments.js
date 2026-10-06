import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { platformAnalyticsApi } from '../../../api';
import { mapPlatformAnalyticsPayments } from '../utils/mapPlatformAnalyticsPayments';

export function usePlatformAnalyticsPayments() {
  const [period, setPeriod] = useState('7d');

  const query = useQuery({
    queryKey: ['platform-analytics-payments', period],
    queryFn: () => platformAnalyticsApi.payments({ period }).then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  const data = useMemo(() => {
    if (!query.data) return null;
    return mapPlatformAnalyticsPayments(query.data, period);
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
