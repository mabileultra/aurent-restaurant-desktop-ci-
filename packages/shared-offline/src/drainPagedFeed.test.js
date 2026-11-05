import { describe, expect, it } from 'vitest';
import { drainPagedFeed } from './drainPagedFeed.js';

describe('@aurent/shared-offline drainPagedFeed', () => {
  it('stops when page under limit', async () => {
    const res = await drainPagedFeed({
      since: 't0',
      pageLimit: 10,
      fetchPage: async () => ({ applied: 3, data: { syncedAt: 't1' } }),
    });
    expect(res).toMatchObject({ skipped: false, applied: 3, pages: 1 });
  });
});
