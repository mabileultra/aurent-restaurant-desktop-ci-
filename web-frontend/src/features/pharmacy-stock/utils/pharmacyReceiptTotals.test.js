import { describe, expect, it } from 'vitest';
import {
  linePurchaseSum,
  receiptDisplayTotals,
  sumReceiptPurchase,
  sumReceiptRetail,
} from './pharmacyReceiptTotals';

describe('pharmacyReceiptTotals', () => {
  const lines = [
    { quantity: 10, purchasePrice: 1000, purchasePriceWithVat: 1120, retailPrice: 1400 },
    { quantity: 2, purchasePrice: 500, purchasePriceWithVat: 560, retailPrice: 700 },
  ];

  it('sums purchase with VAT', () => {
    expect(linePurchaseSum(lines[0])).toBe(11200);
    expect(sumReceiptPurchase(lines)).toBe(12320);
  });

  it('sums retail', () => {
    expect(sumReceiptRetail(lines)).toBe(15400);
  });

  it('prefers lines over stored totals', () => {
    expect(receiptDisplayTotals({ totalCost: 1, totalRetail: 2, lines })).toEqual({
      purchase: 12320,
      retail: 15400,
      lineCount: 2,
    });
  });
});
