import { describe, expect, it } from 'vitest';
import { productStubFromReceiptLine } from './productStubFromReceiptLine';

describe('productStubFromReceiptLine', () => {
  it('returns null without productId', () => {
    expect(productStubFromReceiptLine({})).toBeNull();
    expect(productStubFromReceiptLine(null)).toBeNull();
  });

  it('maps receipt line fields for the product modal', () => {
    expect(productStubFromReceiptLine({
      productId: 'p1',
      productName: 'Аспирин',
      sku: 'ASP',
      barcode: '123',
      ikpu: '000',
      manufacturer: 'Bayer',
      country: 'DE',
      unitsInPack: 10,
    })).toEqual({
      id: 'p1',
      name: 'Аспирин',
      sku: 'ASP',
      barcode: '123',
      ikpu: '000',
      manufacturer: 'Bayer',
      country: 'DE',
      attributes: {
        manufacturer: 'Bayer',
        country: 'DE',
        units_in_pack: '10',
      },
    });
  });
});
