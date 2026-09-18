import { describe, expect, it, vi } from 'vitest';
import { fetchAllPharmacyProductPages } from './fetchAllPharmacyProductPages';

describe('fetchAllPharmacyProductPages', () => {
  it('fetches remaining pages in parallel and merges in order', async () => {
    const listProducts = vi.fn(async ({ page }) => ({
      content: [{ id: page }],
      totalPages: 3,
      totalElements: 3,
    }));

    const result = await fetchAllPharmacyProductPages({
      listProducts,
      pageSize: 1,
      concurrency: 2,
    });

    expect(listProducts).toHaveBeenCalledTimes(3);
    expect(result.content.map((p) => p.id)).toEqual([0, 1, 2]);
    expect(result.totalElements).toBe(3);
  });
});
