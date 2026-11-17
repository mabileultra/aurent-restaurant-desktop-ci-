import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VAT_RATE_PERCENT,
  itemUnitPrice,
  lineVatAmount,
  lineVatRatePercent,
  resolveVatRateLabel,
} from './receiptLineMath';

describe('receiptLineMath', () => {
  it('lineVatRatePercent: default rate, explicit rate, zero for invalid', () => {
    expect(lineVatRatePercent({})).toBe(DEFAULT_VAT_RATE_PERCENT);
    expect(lineVatRatePercent({ taxRatePercent: 15 })).toBe(15);
    expect(lineVatRatePercent({ taxRatePercent: 0 })).toBe(0);
    expect(lineVatRatePercent({ taxRatePercent: 'x' })).toBe(0);
  });

  it('lineVatAmount: stored amount wins, otherwise extracted from the VAT-inclusive total', () => {
    expect(lineVatAmount({ taxAmount: 1607.14, lineTotal: 15000 })).toBe(1607.14);
    expect(lineVatAmount({ lineTotal: 11200, taxRatePercent: 12 })).toBeCloseTo(1200, 2);
    expect(lineVatAmount({ lineTotal: 11200, taxRatePercent: 0 })).toBe(0);
  });

  it('itemUnitPrice: direct price, otherwise line total divided by quantity', () => {
    expect(itemUnitPrice({ unitPrice: 25000, quantity: 2, lineTotal: 50000 })).toBe(25000);
    expect(itemUnitPrice({ price: 300 })).toBe(300);
    expect(itemUnitPrice({ quantity: 4, lineTotal: 1000 })).toBe(250);
    expect(itemUnitPrice({ lineTotal: 1000 })).toBe(1000);
  });

  it('resolveVatRateLabel: single rate or a dash for mixed rates', () => {
    expect(resolveVatRateLabel([{ taxRatePercent: 12 }, {}])).toBe('12');
    expect(resolveVatRateLabel([{ taxRatePercent: 12 }, { taxRatePercent: 15 }])).toBe('—');
    expect(resolveVatRateLabel([{ taxRatePercent: 0 }, { taxRatePercent: 12 }])).toBe('12');
    expect(resolveVatRateLabel([])).toBe('—');
    expect(resolveVatRateLabel(undefined)).toBe('—');
  });
});
