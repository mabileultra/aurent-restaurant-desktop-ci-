import { describe, expect, it } from 'vitest';
import {
  isDiscountExceeded,
  prepareProductCatalogSubmitValues,
} from './productCatalogSubmitHelper';

describe('productCatalogSubmitHelper', () => {
  describe('prepareProductCatalogSubmitValues', () => {
    it('sets restaurant ingredient defaults', () => {
      const values = {
        name: 'Sugar',
        costPrice: 5000,
        sellingPrice: 0,
        sku: '',
      };
      const result = prepareProductCatalogSubmitValues(values, {
        isRestaurantIngredient: true,
        showSection: () => true,
      });

      expect(result.productType).toBe('DISH');
      expect(result.ownerType).toBe('OWN');
      expect(result.taxRate).toBe(0);
      expect(result.sellingPrice).toBe(5000);
      expect(result.sku.startsWith('ING-')).toBe(true);
    });

    it('generates fallback sku if skuField hidden and sku empty', () => {
      const values = {
        name: 'Bread',
        sku: '',
      };
      const result = prepareProductCatalogSubmitValues(values, {
        isRestaurantIngredient: false,
        showSection: (section) => section !== 'skuField',
      });

      expect(result.sku.startsWith('AUTO-')).toBe(true);
    });
  });

  describe('isDiscountExceeded', () => {
    it('returns true when discount exceeds max discount percent', () => {
      const submitValues = { defaultDiscountPercent: 25 };
      const options = {
        isRestaurantIngredient: false,
        showSection: (section) => section === 'accountingDiscount',
        maxDiscountPercent: 20,
      };

      expect(isDiscountExceeded(submitValues, options)).toBe(true);
    });

    it('returns false for restaurant ingredients', () => {
      const submitValues = { defaultDiscountPercent: 50 };
      const options = {
        isRestaurantIngredient: true,
        showSection: () => true,
        maxDiscountPercent: 20,
      };

      expect(isDiscountExceeded(submitValues, options)).toBe(false);
    });
  });
});
