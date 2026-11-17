import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { executeToggleForceOffline } from './offlineForceToggle';
import { useConnectivityStore } from '../../../store/connectivityStore';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('offlineForceToggle', () => {
  const mockT = (key) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('turns off forceOfflineMode when enabled is false', async () => {
    const qc = { invalidateQueries: vi.fn() };
    await executeToggleForceOffline({
      enabled: false,
      storeId: 1,
      canSellOffline: true,
      catalogKind: 'grocery',
      posRoute: {},
      qc,
      t: mockT,
    });

    expect(useConnectivityStore.getState().forceOfflineMode).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('offline.forceOfflineOff', expect.any(Object));
  });

  it('requires desktop bridge when enabled is true in browser', async () => {
    const qc = { invalidateQueries: vi.fn() };
    await executeToggleForceOffline({
      enabled: true,
      storeId: 1,
      canSellOffline: true,
      catalogKind: 'grocery',
      posRoute: {},
      qc,
      t: mockT,
    });

    expect(toast.error).toHaveBeenCalledWith('offline.desktopBridgeRequired', expect.any(Object));
  });
});
