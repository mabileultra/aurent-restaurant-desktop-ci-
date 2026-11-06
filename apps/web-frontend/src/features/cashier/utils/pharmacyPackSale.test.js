import { describe, expect, it } from 'vitest';
import { pharmacyCheckoutLineFromCartItem } from './pharmacyPackSale';

describe('pharmacyCheckoutLineFromCartItem', () => {
  it('converts mixed pieces back to pack qty and pack price', () => {
    const line = pharmacyCheckoutLineFromCartItem({
      quantity: 110,
      unitPrice: 800,
      unitsInPack: 100,
      pharmacySellByPiece: true,
      packUnitPrice: 80000,
    });
    expect(line.quantity).toBe(1.1);
    expect(line.unitPrice).toBe(80000);
  });

  it('keeps whole packs as-is when piece sale is off', () => {
    expect(pharmacyCheckoutLineFromCartItem({
      quantity: 2,
      unitPrice: 80000,
      unitsInPack: 100,
      pharmacySellByPiece: false,
    })).toBeNull();
  });

  it('converts piece sale even when markedProduct is true but no KM', () => {
    const line = pharmacyCheckoutLineFromCartItem({
      quantity: 112,
      unitPrice: 2455.14,
      unitsInPack: 100,
      pharmacySellByPiece: true,
      packUnitPrice: 245513.66,
      markedProduct: true,
    });
    expect(line.quantity).toBe(1.12);
    expect(line.unitPrice).toBe(245513.66);
  });
});
