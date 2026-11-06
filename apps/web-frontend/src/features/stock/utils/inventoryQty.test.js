import { describe, expect, it } from 'vitest';
import { bumpInventoryQty, inventoryQtyStep } from './inventoryQty';

describe('inventoryQtyStep', () => {
  it('steps a piece and a bottled liter by 1', () => {
    expect(inventoryQtyStep({ saleType: 'PIECE', unitCode: 'PCS', quantityScale: 0 })).toBe(1);
    expect(inventoryQtyStep({ saleType: 'WEIGHT', unitCode: 'L', quantityScale: 3 })).toBe(1);
  });

  it('steps a kilogram by 0.001', () => {
    expect(inventoryQtyStep({ saleType: 'WEIGHT', unitCode: 'KG', quantityScale: 3 })).toBe(0.001);
  });
});

describe('bumpInventoryQty', () => {
  it('subtracts one piece', () => {
    const product = { saleType: 'PIECE', unitCode: 'PCS', quantityScale: 0 };
    expect(bumpInventoryQty('5', product, -1)).toBe('4');
    expect(bumpInventoryQty('', product, 1)).toBe('1');
  });

  it('subtracts one bottle stored as liters', () => {
    const product = { saleType: 'WEIGHT', unitCode: 'L', quantityScale: 3 };
    expect(bumpInventoryQty('', product, 1)).toBe('1');
    expect(bumpInventoryQty('3', product, -1)).toBe('2');
  });

  it('changes kilograms by 0.001', () => {
    const product = { saleType: 'WEIGHT', unitCode: 'KG', quantityScale: 3 };
    expect(bumpInventoryQty('', product, 1)).toBe('0.001');
    expect(bumpInventoryQty('1', product, -1)).toBe('0.999');
  });
});
