import { useQuery } from '@tanstack/react-query';
import { fetchExecutiveSummary } from '../api/executive.api';
import type { ExecutivePeriod } from '../api/types';
import { useAuth } from './useAuth';

export function useExecutiveSummary(period: ExecutivePeriod = 'TODAY') {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['executive-summary', period],
    queryFn: () => fetchExecutiveSummary(period),
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
