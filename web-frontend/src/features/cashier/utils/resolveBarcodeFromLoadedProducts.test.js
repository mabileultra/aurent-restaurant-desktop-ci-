import { describe, expect, it } from 'vitest';
import { resolveBarcodeFromLoadedProducts } from './resolveBarcodeFromLoadedProducts';

describe('resolveBarcodeFromLoadedProducts', () => {
  it('matches additional barcode without network', () => {
    const products = [
      { id: 1, barcode: '111', barcodes: ['111', '222'], name: 'A' },
    ];
    expect(resolveBarcodeFromLoadedProducts(products, '222')).toEqual({
      product: { id: 1, barcode: '222', barcodes: ['111', '222'], name: 'A' },
      code: '222',
    });
  });

  it('matches ikpu without rewriting barcode', () => {
    const products = [{ id: 2, barcode: '111', ikpu: '03305005001000000', name: 'B' }];
    expect(resolveBarcodeFromLoadedProducts(products, '03305005001000000')).toEqual({
      product: products[0],
      code: '03305005001000000',
    });
  });
});
