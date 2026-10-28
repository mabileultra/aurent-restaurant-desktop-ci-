import { describe, expect, it } from 'vitest';
import { bumpImportQty, importQtyStep } from './productImportQty';

describe('productImportQty', () => {
  it('steps pieces and liters by 1', () => {
    expect(importQtyStep({ saleType: 'PIECE', unitOfMeasure: 'шт' })).toBe(1);
    expect(importQtyStep({ saleType: 'WEIGHT', unitOfMeasure: 'л' })).toBe(1);
  });

  it('steps kilograms by 0.001', () => {
    expect(importQtyStep({ saleType: 'WEIGHT', unitOfMeasure: 'кг' })).toBe(0.001);
  });

  it('decreases a piece and does not go below zero', () => {
    expect(bumpImportQty(5, { unitOfMeasure: 'шт' }, -1)).toBe('4');
    expect(bumpImportQty(0, { unitOfMeasure: 'шт' }, -1)).toBe('0');
  });

  it('decreases a kilogram', () => {
    expect(bumpImportQty(1, { unitOfMeasure: 'кг' }, -1)).toBe('0.999');
  });
});
