import { describe, expect, it } from 'vitest';
import {
  buildLine,
  calculateCartTotals,
  capOrderDiscount,
  lineDiscountAmount,
  lineGross,
  lineSubtotal,
} from './cartCalculations';

describe('cartCalculations', () => {
  it('calculates lineGross and lineSubtotal correctly', () => {
    const item = { unitPrice: 10000, quantity: 2, discount: 0, discountPercent: 0 };
    expect(lineGross(item)).toBe(20000);
    expect(lineSubtotal(item)).toBe(20000);
  });

  it('calculates percent discount correctly', () => {
    const item = { unitPrice: 10000, quantity: 2, discount: 0, discountPercent: 10 };
    expect(lineDiscountAmount(item)).toBe(2000);
    expect(lineSubtotal(item)).toBe(18000);
  });

  it('caps order discount at lines total', () => {
    const items = [
      { unitPrice: 10000, quantity: 2, discount: 0, discountPercent: 0 },
    ];
    expect(capOrderDiscount(items, 25000)).toBe(20000);
    expect(capOrderDiscount(items, 5000)).toBe(5000);
    expect(capOrderDiscount(items, -500)).toBe(0);
  });

  it('buildLine sets correct properties', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      sku: 'SKU1',
      sellingPrice: 15000,
    };
    const line = buildLine(product, 3);
    expect(line.productId).toBe(1);
    expect(line.quantity).toBe(3);
    expect(line.unitPrice).toBe(15000);
    expect(line.lineId).toBeDefined();
  });

  it('calculateCartTotals computes totals correctly', () => {
    const items = [
      { unitPrice: 10000, quantity: 2, discount: 0, discountPercent: 10, taxRate: 12 },
    ];
    const totals = calculateCartTotals(items, 3000);
    expect(totals.linesTotal).toBe(18000);
    expect(totals.orderDiscount).toBe(3000);
    expect(totals.total).toBe(15000);
  });
});
