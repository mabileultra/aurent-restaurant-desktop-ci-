import { apiClient } from './client';
import type { ExecutivePeriod, ExecutiveSummary } from './types';

export async function fetchExecutiveSummary(
  period: ExecutivePeriod = 'TODAY',
  storeId?: number | null,
): Promise<ExecutiveSummary> {
  const { data } = await apiClient.get<ExecutiveSummary>('/finance/executive/summary', {
    params: {
      period,
      ...(storeId != null ? { storeId } : {}),
    },
  });
  return data;
}
