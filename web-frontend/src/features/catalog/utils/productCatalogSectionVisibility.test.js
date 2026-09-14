import { describe, expect, it } from 'vitest';
import {
  CATALOG_PROFILE_RESTAURANT_INGREDIENT,
  resolveCatalogSectionVisible,
} from '../../../config/productCatalogConfig';

describe('resolveCatalogSectionVisible restaurantIngredient', () => {
  const opts = { productType: 'DISH', catalogProfile: CATALOG_PROFILE_RESTAURANT_INGREDIENT };

  it('keeps only kitchen ingredient sections', () => {
    expect(resolveCatalogSectionVisible('typeSelectors', opts)).toBe(true);
    expect(resolveCatalogSectionVisible('accounting', opts)).toBe(true);
    expect(resolveCatalogSectionVisible('accountingCost', opts)).toBe(true);
    expect(resolveCatalogSectionVisible('accountingStock', opts)).toBe(true);
  });

  it('hides retail extras', () => {
    expect(resolveCatalogSectionVisible('tasnif', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('ownerVat', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('barcodes', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('storePrices', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('accountingSell', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('dynamicFields', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('productTypeField', opts)).toBe(false);
    expect(resolveCatalogSectionVisible('skuField', opts)).toBe(false);
  });
});
