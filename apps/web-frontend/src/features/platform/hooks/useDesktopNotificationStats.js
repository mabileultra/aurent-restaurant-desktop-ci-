import { useQuery } from '@tanstack/react-query';
import { platformCashRegistersApi } from '../../../api';

export function useDesktopNotificationStats() {
  const registersStatsQuery = useQuery({
    queryKey: ['platform-cash-registers-stats'],
    queryFn: () =>
      platformCashRegistersApi
        .getStats()
        .then((r) => r.data)
        .catch(() => null),
    staleTime: 60_000,
  });

  const totalRegistersCount = registersStatsQuery.data?.totalRegisters ?? null;
  const activeRegistersCount =
    registersStatsQuery.data?.activeRegisters ?? totalRegistersCount;
  const onlineRegistersCount = registersStatsQuery.data?.onlineRegisters ?? null;

  return {
    totalRegistersCount,
    activeRegistersCount,
    onlineRegistersCount,
    isLoading: registersStatsQuery.isLoading,
  };
}
