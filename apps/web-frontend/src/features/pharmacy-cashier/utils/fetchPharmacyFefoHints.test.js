import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchPharmacyFefoHints, PHARMACY_FEFO_HINT_CHUNK } from './fetchPharmacyFefoHints';

vi.mock('../../../api', () => ({
  pharmacyWarehouseApi: {
    fefoHints: vi.fn(),
  },
}));

import { pharmacyWarehouseApi } from '../../../api';

describe('fetchPharmacyFefoHints', () => {
  beforeEach(() => {
    pharmacyWarehouseApi.fefoHints.mockReset();
  });

  it('loads chunks sequentially', async () => {
    const ids = Array.from({ length: PHARMACY_FEFO_HINT_CHUNK + 5 }, (_, i) => `id-${i}`);
    pharmacyWarehouseApi.fefoHints
      .mockResolvedValueOnce({ data: [{ productId: 'id-0', batchNumber: 'A' }] })
      .mockResolvedValueOnce({ data: [{ productId: 'id-40', batchNumber: 'B' }] });

    const hints = await fetchPharmacyFefoHints(1, ids);
    expect(pharmacyWarehouseApi.fefoHints).toHaveBeenCalledTimes(2);
    expect(hints).toHaveLength(2);
  });
});
