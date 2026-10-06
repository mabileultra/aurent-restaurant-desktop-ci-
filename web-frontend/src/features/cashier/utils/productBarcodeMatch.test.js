import { describe, expect, it } from 'vitest';
import { findProductBarcode, withScannedBarcode } from './productBarcodeMatch';

const product = { id: 1, barcode: '111', barcodes: ['111', '222', '333'] };

describe('productBarcodeMatch', () => {
  it('находит дополнительный штрихкод', () => {
    expect(findProductBarcode(product, ' 333 ')).toBe('333');
  });

  it('подставляет отсканированный доп. штрихкод в товар', () => {
    expect(withScannedBarcode(product, '222').barcode).toBe('222');
  });

  it('не трогает товар, если код не из его штрихкодов (весовая этикетка)', () => {
    expect(withScannedBarcode(product, '2100001005004')).toBe(product);
  });
});
