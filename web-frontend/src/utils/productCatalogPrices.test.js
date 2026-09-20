import { describe, expect, it } from 'vitest';
import {
  buildStorePrices,
  resolveStorePricesForPayload,
} from './productCatalogPrices';

describe('resolveStorePricesForPayload', () => {
  it('uses store row prices when storePrices section is enabled', () => {
    expect(
      resolveStorePricesForPayload({
        storeRows: [{ storeId: '5', price: '1' }],
        sellingPrice: 14000,
        storePricesEnabled: true,
      })
    ).toEqual([{ storeId: 5, price: 1 }]);
  });

  it('ignores stale store row price when section is hidden', () => {
    expect(
      resolveStorePricesForPayload({
        storeRows: [{ storeId: '5', price: '1' }],
        sellingPrice: 14000,
        storePricesEnabled: false,
      })
    ).toEqual([{ storeId: 5, price: 14000 }]);
  });

  it('falls back to selected store with selling price when hidden and rows empty', () => {
    expect(
      resolveStorePricesForPayload({
        storeRows: [{ storeId: '', price: '' }],
        sellingPrice: 14000,
        storePricesEnabled: false,
        fallbackStoreId: 18,
      })
    ).toEqual([{ storeId: 18, price: 14000 }]);
  });

  it('buildStorePrices still fills empty row price from selling', () => {
    expect(buildStorePrices([{ storeId: '5', price: '' }], 14000)).toEqual([
      { storeId: 5, price: 14000 },
    ]);
  });
});
