import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api', () => ({
  resolveSyncApi: vi.fn(),
}));

vi.mock('../../../src/store/connectivityStore', () => ({
  markApiReachable: vi.fn(),
}));

vi.mock('../../../src/services/desktop/activityLog', () => ({
  logCatalog: vi.fn(),
}));

vi.mock('../../../src/services/offline/desktopOfflineBridge', () => ({
  isDesktopOfflineBridge: vi.fn(() => true),
  offlineImportCatalogDelta: vi.fn(),
}));

import { resolveSyncApi } from '../../../src/services/api';
import {
  offlineImportCatalogDelta,
  isDesktopOfflineBridge,
} from '../../../src/services/offline/desktopOfflineBridge';
import {
  pullAndApplyCatalogDelta,
  shouldUseCatalogDelta,
} from '../../../src/services/offline/catalogDeltaSync';

describe('shouldUseCatalogDelta', () => {
  it('skips pharmacy, force, mismatch, and empty since', () => {
    expect(
      shouldUseCatalogDelta({
        catalogKind: 'pharmacy',
        force: false,
        storeMismatch: false,
        lastCatalogSyncAt: '2026-10-30T00:00:00Z',
      }),
    ).toBe(false);
    expect(
      shouldUseCatalogDelta({
        catalogKind: 'grocery',
        force: true,
        storeMismatch: false,
        lastCatalogSyncAt: '2026-10-30T00:00:00Z',
      }),
    ).toBe(false);
    expect(
      shouldUseCatalogDelta({
        catalogKind: 'grocery',
        force: false,
        storeMismatch: true,
        lastCatalogSyncAt: '2026-10-30T00:00:00Z',
      }),
    ).toBe(false);
    expect(
      shouldUseCatalogDelta({
        catalogKind: 'grocery',
        force: false,
        storeMismatch: false,
        lastCatalogSyncAt: null,
      }),
    ).toBe(false);
  });

  it('allows grocery delta when since is present', () => {
    expect(
      shouldUseCatalogDelta({
        catalogKind: 'grocery',
        force: false,
        storeMismatch: false,
        lastCatalogSyncAt: '2026-10-30T00:00:00Z',
      }),
    ).toBe(true);
  });
});

describe('pullAndApplyCatalogDelta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDesktopOfflineBridge.mockReturnValue(true);
  });

  it('returns fullReset when server asks for bootstrap', async () => {
    resolveSyncApi.mockReturnValue({
      catalogDelta: vi.fn().mockResolvedValue({ data: { fullReset: true } }),
    });

    const result = await pullAndApplyCatalogDelta(7, '2026-10-30T00:00:00Z', {
      catalogKind: 'grocery',
    });

    expect(result.fullReset).toBe(true);
    expect(offlineImportCatalogDelta).not.toHaveBeenCalled();
  });

  it('applies delta payload to desktop bridge', async () => {
    const payload = {
      fullReset: false,
      products: [{ id: 'a' }],
      removedProductIds: ['b'],
      syncedAt: '2026-10-30T01:00:00Z',
    };
    resolveSyncApi.mockReturnValue({
      catalogDelta: vi.fn().mockResolvedValue({ data: payload }),
    });
    offlineImportCatalogDelta.mockResolvedValue({ ok: true, upserted: 1, removed: 1 });

    const result = await pullAndApplyCatalogDelta(7, '2026-10-30T00:00:00Z', {
      catalogKind: 'grocery',
    });

    expect(result.fullReset).toBe(false);
    expect(offlineImportCatalogDelta).toHaveBeenCalledWith(payload);
    expect(result.imported.upserted).toBe(1);
  });
});
