import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearPharmacyBarcodeCache,
  getCachedPharmacyProduct,
  pharmacyBarcodeCacheSize,
  setCachedPharmacyProduct,
  warmPharmacyBarcodeCache,
} from './pharmacyBarcodeProductCache';

describe('pharmacyBarcodeProductCache', () => {
  beforeEach(() => {
    clearPharmacyBarcodeCache();
  });

  it('stores and returns product by barcode', () => {
    const product = { id: 'p1', barcode: '478001', name: 'A' };
    setCachedPharmacyProduct(7, '478001', product);
    expect(getCachedPharmacyProduct(7, '478001')).toEqual(product);
    expect(getCachedPharmacyProduct(8, '478001')).toBeNull();
  });

  it('warms from catalog page', () => {
    warmPharmacyBarcodeCache(3, [
      { id: 'p2', barcode: '111', sku: 'SKU2' },
      { id: 'p3', barcodes: ['222', '333'] },
    ]);
    expect(getCachedPharmacyProduct(3, '111')?.id).toBe('p2');
    expect(getCachedPharmacyProduct(3, 'SKU2')?.id).toBe('p2');
    expect(getCachedPharmacyProduct(3, '222')?.id).toBe('p3');
    expect(pharmacyBarcodeCacheSize()).toBeGreaterThanOrEqual(3);
  });

  it('indexes GTIN-13 and GTIN-14 variants', () => {
    const product = { id: 'nimid', barcode: '8906002059409' };
    setCachedPharmacyProduct(5, '8906002059409', product);
    expect(getCachedPharmacyProduct(5, '8906002059409')?.id).toBe('nimid');
    expect(getCachedPharmacyProduct(5, '08906002059409')?.id).toBe('nimid');
  });
});
