import { describe, expect, it } from 'vitest';
import {
  linePurchaseSum,
  receiptDisplayTotals,
  sumReceiptPurchase,
  sumReceiptRetail,
} from './pharmacyReceiptTotals';

describe('pharmacyReceiptTotals', () => {
  const lines = [
    { quantity: 10, purchasePrice: 1000, purchasePriceWithVat: 1120, vatPercent: 12, retailPrice: 1400 },
    { quantity: 2, purchasePrice: 500, purchasePriceWithVat: 560, vatPercent: 12, retailPrice: 700 },
  ];

  it('sums purchase without VAT', () => {
    expect(linePurchaseSum(lines[0])).toBe(10000);
    expect(sumReceiptPurchase(lines)).toBe(11000);
  });

  it('sums retail', () => {
    expect(sumReceiptRetail(lines)).toBe(15400);
  });

  it('ignores stored lineCost (with VAT) and uses purchasePrice', () => {
    expect(linePurchaseSum({
      lineCost: 99.5,
      purchasePrice: 30,
      purchasePriceWithVat: 33.6,
      vatPercent: 12,
      quantity: 3,
    })).toBe(90);
  });

  it('strips VAT when only purchasePriceWithVat is present', () => {
    expect(linePurchaseSum({
      purchasePriceWithVat: 1120,
      vatPercent: 12,
      quantity: 2,
    })).toBe(2000);
  });

  it('prefers lines over stored totals', () => {
    expect(receiptDisplayTotals({ totalCost: 1, totalRetail: 2, lines })).toEqual({
      purchase: 11000,
      retail: 15400,
      lineCount: 2,
    });
  });
});
