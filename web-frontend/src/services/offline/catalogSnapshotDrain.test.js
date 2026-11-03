import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./catalogSnapshotSync', () => ({
  pullAndApplyCatalogSnapshots: vi.fn(),
}));

import { pullAndApplyCatalogSnapshots } from './catalogSnapshotSync';
import { drainCatalogSnapshots } from './catalogSnapshotDrain';

describe('drainCatalogSnapshots', () => {
  beforeEach(() => {
    pullAndApplyCatalogSnapshots.mockReset();
  });

  it('stops when a page returns fewer than pageLimit events', async () => {
    pullAndApplyCatalogSnapshots
      .mockResolvedValueOnce({
        skipped: false,
        applied: 100,
        data: { syncedAt: 't1' },
      })
      .mockResolvedValueOnce({
        skipped: false,
        applied: 12,
        data: { syncedAt: 't2' },
      });

    const res = await drainCatalogSnapshots('t0', { pageLimit: 100, maxPages: 5 });
    expect(res.applied).toBe(112);
    expect(res.pages).toBe(2);
    expect(pullAndApplyCatalogSnapshots).toHaveBeenCalledTimes(2);
  });
});
