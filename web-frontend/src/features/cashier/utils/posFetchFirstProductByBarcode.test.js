import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/pos/posDataRouter', () => ({
  posFetchProductByBarcode: vi.fn(),
}));

import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { posFetchFirstProductByBarcode } from './posFetchFirstProductByBarcode';

describe('posFetchFirstProductByBarcode', () => {
  beforeEach(() => {
    posFetchProductByBarcode.mockReset();
  });

  it('returns first candidate hit in candidate order', async () => {
    posFetchProductByBarcode.mockImplementation(async (_store, code) => {
      if (code === '08801046877388') return { id: 2, barcode: code };
      if (code === '8801046877388') return { id: 1, barcode: code };
      return null;
    });

    const hit = await posFetchFirstProductByBarcode(1, '8801046877388');
    expect(hit).toEqual({ product: { id: 1, barcode: '8801046877388' }, code: '8801046877388' });
  });

  it('fires candidates in parallel', async () => {
    let inflight = 0;
    let maxInflight = 0;
    posFetchProductByBarcode.mockImplementation(async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((r) => setTimeout(r, 20));
      inflight -= 1;
      return null;
    });

    await posFetchFirstProductByBarcode(1, '8801046877388');
    expect(maxInflight).toBeGreaterThan(1);
  });
});
