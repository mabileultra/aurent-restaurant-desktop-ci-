import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./canRunOnlineSync', () => ({
  canRunOnlineSync: vi.fn(),
}));
vi.mock('./desktopOfflineBridge', () => ({
  offlineGetStatus: vi.fn(),
}));
vi.mock('./offlineSyncService', () => ({
  runCatalogSyncIfNeeded: vi.fn(),
  runSalesSyncOnly: vi.fn(),
}));
vi.mock('../../store/connectivityStore', () => ({
  useConnectivityStore: {
    getState: vi.fn(() => ({
      setSyncing: vi.fn(),
      setSyncingCatalog: vi.fn(),
      setSyncPhase: vi.fn(),
      setSyncResult: vi.fn(),
    })),
  },
}));

import { canRunOnlineSync } from './canRunOnlineSync';
import { offlineGetStatus } from './desktopOfflineBridge';
import { runCatalogSyncIfNeeded, runSalesSyncOnly } from './offlineSyncService';
import { runDesktopReconnectSync } from './runDesktopReconnectSync';

describe('runDesktopReconnectSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips when offline', async () => {
    canRunOnlineSync.mockReturnValue(false);
    const result = await runDesktopReconnectSync(1, { catalogKind: 'grocery' });
    expect(result.skipped).toBe(true);
    expect(runCatalogSyncIfNeeded).not.toHaveBeenCalled();
  });

  it('runs sales first then catalog when local DB ready', async () => {
    canRunOnlineSync.mockReturnValue(true);
    offlineGetStatus.mockResolvedValue({
      storeId: 1,
      bootstrapReady: true,
      canSellOffline: true,
      productCount: 10,
    });
    runCatalogSyncIfNeeded.mockResolvedValue({ skipped: true, reason: 'fresh' });
    runSalesSyncOnly.mockResolvedValue({ pushed: 2, failed: 0 });

    const result = await runDesktopReconnectSync(1, { catalogKind: 'grocery' });
    expect(result.skipped).toBe(false);
    expect(runSalesSyncOnly).toHaveBeenCalledWith({ catalogKind: 'grocery' });
    expect(runCatalogSyncIfNeeded).toHaveBeenCalledWith(1, {
      force: false,
      catalogKind: 'grocery',
    });
    expect(runSalesSyncOnly.mock.invocationCallOrder[0]).toBeLessThan(
      runCatalogSyncIfNeeded.mock.invocationCallOrder[0],
    );
    expect(result.sales.pushed).toBe(2);
  });

  it('forces catalog before sales when local DB empty', async () => {
    canRunOnlineSync.mockReturnValue(true);
    offlineGetStatus.mockResolvedValue({
      storeId: 1,
      bootstrapReady: false,
      productCount: 0,
    });
    runCatalogSyncIfNeeded.mockResolvedValue({ skipped: false, productCount: 5 });
    runSalesSyncOnly.mockResolvedValue({ pushed: 0, failed: 0 });

    await runDesktopReconnectSync(1, { catalogKind: 'pharmacy' });
    expect(runCatalogSyncIfNeeded).toHaveBeenCalledWith(1, {
      force: true,
      catalogKind: 'pharmacy',
    });
    expect(runCatalogSyncIfNeeded.mock.invocationCallOrder[0]).toBeLessThan(
      runSalesSyncOnly.mock.invocationCallOrder[0],
    );
  });
});
