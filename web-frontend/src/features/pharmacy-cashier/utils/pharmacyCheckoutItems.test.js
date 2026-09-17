import { describe, it, expect } from 'vitest';
import { resolveCheckoutLineItems } from './pharmacyCheckoutItems';

describe('resolveCheckoutLineItems', () => {
  it('does not pack-convert marked lines with unitsInPack', () => {
    const items = [
      {
        productId: 'p1',
        quantity: 2,
        unitPrice: 50000,
        discount: 0,
        markedProduct: true,
        productMarks: ['mark-a', 'mark-b'],
        unitsInPack: 10,
        pharmacySellByPiece: false,
        packUnitPrice: null,
      },
    ];
    const lines = resolveCheckoutLineItems(items);
    expect(lines).toEqual([
      {
        productId: 'p1',
        quantity: 2,
        discount: 0,
        unitPrice: 50000,
      },
    ]);
  });

  it('still converts piece-sale packs to pack qty for API', () => {
    const items = [
      {
        productId: 'p2',
        quantity: 20,
        unitPrice: 5000,
        discount: 0,
        unitsInPack: 10,
        pharmacySellByPiece: true,
        packUnitPrice: 50000,
      },
    ];
    const lines = resolveCheckoutLineItems(items);
    expect(lines[0].quantity).toBe(2);
    expect(lines[0].unitPrice).toBe(50000);
  });
});
