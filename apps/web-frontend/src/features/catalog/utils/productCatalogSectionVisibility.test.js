import { describe, expect, it } from 'vitest';
import {
  CATALOG_PROFILE_RESTAURANT_INGREDIENT,
  resolveCatalogSectionVisible,
} from '../../../config/productCatalogConfig';
import {
  formFieldsToSectionMap,
  isCatalogFormSectionEnabled,
} from '../../../config/productCatalogFormFields';

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

describe('resolveCatalogSectionVisible tasnif', () => {
  it('shows for retail and construction material products', () => {
    expect(resolveCatalogSectionVisible('tasnif', { productType: 'RETAIL' })).toBe(true);
    expect(resolveCatalogSectionVisible('tasnif', { productType: 'MATERIAL' })).toBe(true);
  });

  it('hides for dish by default', () => {
    expect(resolveCatalogSectionVisible('tasnif', { productType: 'DISH' })).toBe(false);
  });
});

describe('resolveCatalogSectionVisible formSectionMap', () => {
  it('hides section when constructor disables it', () => {
    const formSectionMap = formFieldsToSectionMap([
      { ruleKey: 'catalog.form.barcodes', enabled: false },
    ]);
    expect(
      resolveCatalogSectionVisible('barcodes', { productType: 'RETAIL', formSectionMap })
    ).toBe(false);
  });

  it('keeps product-type gate even if form field enabled', () => {
    const formSectionMap = formFieldsToSectionMap([
      { ruleKey: 'catalog.form.tasnifSearch', enabled: true },
    ]);
    expect(
      resolveCatalogSectionVisible('tasnifSearch', { productType: 'DISH', formSectionMap })
    ).toBe(false);
  });

  it('expands legacy tasnif key to fiscal children', () => {
    const formSectionMap = formFieldsToSectionMap([
      { ruleKey: 'catalog.form.tasnif', enabled: false },
    ]);
    expect(formSectionMap.tasnifSearch).toBe(false);
    expect(formSectionMap.fiscalIkpu).toBe(false);
  });
});

describe('formFieldsToSectionMap', () => {
  it('defaults all sections to enabled', () => {
    const map = formFieldsToSectionMap([]);
    expect(isCatalogFormSectionEnabled(map, 'skuField')).toBe(true);
    expect(isCatalogFormSectionEnabled(map, 'tasnifSearch')).toBe(true);
    expect(isCatalogFormSectionEnabled(map, 'descriptionField')).toBe(true);
  });
});
