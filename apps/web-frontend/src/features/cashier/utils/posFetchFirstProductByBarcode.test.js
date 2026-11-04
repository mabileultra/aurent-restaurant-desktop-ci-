import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/pos/posDataRouter', () => ({
  posFetchProductByBarcode: vi.fn(),
}));

import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { clearPosBarcodeHitCache } from './posBarcodeHitCache';
import { posFetchFirstProductByBarcode } from './posFetchFirstProductByBarcode';

describe('posFetchFirstProductByBarcode', () => {
  beforeEach(() => {
    posFetchProductByBarcode.mockReset();
    clearPosBarcodeHitCache();
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

  it('returns as soon as the preferred candidate hits (does not wait for slower tails)', async () => {
    posFetchProductByBarcode.mockImplementation(async (_store, code) => {
      if (code === '8801046877388') {
        await new Promise((r) => setTimeout(r, 5));
        return { id: 1, barcode: code };
      }
      await new Promise((r) => setTimeout(r, 80));
      return { id: 99, barcode: code };
    });

    const started = Date.now();
    const hit = await posFetchFirstProductByBarcode(1, '8801046877388');
    expect(hit?.product?.id).toBe(1);
    expect(Date.now() - started).toBeLessThan(60);
  });

  it('second lookup hits session cache without calling API again', async () => {
    posFetchProductByBarcode.mockResolvedValue({ id: 5, barcode: '111' });
    await posFetchFirstProductByBarcode(1, '111');
    posFetchProductByBarcode.mockClear();
    const hit = await posFetchFirstProductByBarcode(1, '111');
    expect(hit).toEqual({ product: { id: 5, barcode: '111' }, code: '111' });
    expect(posFetchProductByBarcode).not.toHaveBeenCalled();
  });
});

