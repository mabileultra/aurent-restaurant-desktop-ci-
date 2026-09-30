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

  it('falls back to all active stores when hidden, rows empty, and no selected store (edit)', () => {
    expect(
      resolveStorePricesForPayload({
        storeRows: [{ storeId: '', price: '' }],
        sellingPrice: 35000,
        storePricesEnabled: false,
        fallbackStoreId: null,
        fallbackStoreIds: [3, 7],
      })
    ).toEqual([
      { storeId: 3, price: 35000 },
      { storeId: 7, price: 35000 },
    ]);
  });

  it('when hidden, prefers all active stores over incomplete storeRows', () => {
    expect(
      resolveStorePricesForPayload({
        storeRows: [{ storeId: '3', price: '1' }],
        sellingPrice: 35000,
        storePricesEnabled: false,
        fallbackStoreIds: [3, 7],
      })
    ).toEqual([
      { storeId: 3, price: 35000 },
      { storeId: 7, price: 35000 },
    ]);
  });

  it('buildStorePrices still fills empty row price from selling', () => {
    expect(buildStorePrices([{ storeId: '5', price: '' }], 14000)).toEqual([
      { storeId: 5, price: 14000 },
    ]);
  });
});
