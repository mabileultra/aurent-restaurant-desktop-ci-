import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { platformAnalyticsApi } from '../../../api';
import { mapPlatformAnalyticsFiscal } from '../utils/mapPlatformAnalyticsFiscal';

export function usePlatformAnalyticsFiscal() {
  const [period, setPeriod] = useState('7d');

  const query = useQuery({
    queryKey: ['platform-analytics-fiscal', period],
    queryFn: () => platformAnalyticsApi.fiscal({ period }).then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  const data = useMemo(() => {
    if (!query.data) return null;
    return mapPlatformAnalyticsFiscal(query.data, period);
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
