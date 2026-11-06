import { describe, expect, it } from 'vitest';
import { planCatalogStockDeltas } from './planCatalogStockDeltas';

describe('planCatalogStockDeltas', () => {
  it('turns a doubled opening stock of 20 back into 10', () => {
    expect(planCatalogStockDeltas({
      desiredTotal: 10,
      quantitiesByStore: { 3: 10, 7: 10 },
      preferredStoreId: 3,
    })).toEqual([{ storeId: 3, delta: -10 }]);
  });

  it('does nothing when the typed total already matches', () => {
    expect(planCatalogStockDeltas({
      desiredTotal: 20,
      quantitiesByStore: { 3: 10, 7: 10 },
      preferredStoreId: 3,
    })).toEqual([]);
  });

  it('adds the increase to the preferred store', () => {
    expect(planCatalogStockDeltas({
      desiredTotal: 15,
      quantitiesByStore: { 3: 5, 7: 5 },
      preferredStoreId: 7,
    })).toEqual([{ storeId: 7, delta: 5 }]);
  });
});
