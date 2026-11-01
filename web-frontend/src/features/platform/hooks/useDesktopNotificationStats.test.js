import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../api', () => ({
  platformCashRegistersApi: {
    getStats: vi.fn().mockResolvedValue({
      data: { totalRegisters: 100, activeRegisters: 85, onlineRegisters: 40 },
    }),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    if (queryKey[0] === 'platform-cash-registers-stats') {
      return {
        data: { totalRegisters: 100, activeRegisters: 85, onlineRegisters: 40 },
        isLoading: false,
      };
    }
    return { data: null, isLoading: false };
  },
}));

import { useDesktopNotificationStats } from './useDesktopNotificationStats';

describe('useDesktopNotificationStats', () => {
  it('returns parsed cashier registers statistics', () => {
    const stats = useDesktopNotificationStats();
    expect(stats.totalRegistersCount).toBe(100);
    expect(stats.activeRegistersCount).toBe(85);
    expect(stats.onlineRegistersCount).toBe(40);
  });
});
