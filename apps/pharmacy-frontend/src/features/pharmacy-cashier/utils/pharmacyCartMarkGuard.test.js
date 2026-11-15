import { describe, expect, it } from 'vitest';
import {
  assertCartMarkedKmReady,
  cartMarkedLinesMissingKm,
  isMarkedLineMissingKm,
  lineHasProductMark,
} from './pharmacyCartMarkGuard';

describe('pharmacyCartMarkGuard', () => {
  it('lineHasProductMark: mark fields', () => {
    expect(lineHasProductMark({ productMarks: ['KM1'] })).toBe(true);
    expect(lineHasProductMark({ productMark: 'KM1' })).toBe(true);
    expect(lineHasProductMark({ markCode: 'KM1' })).toBe(true);
    expect(lineHasProductMark({ productMarks: [] })).toBe(false);
    expect(lineHasProductMark({ markedProduct: true })).toBe(false);
  });

  it('isMarkedLineMissingKm: only marked without KM', () => {
    expect(isMarkedLineMissingKm({ markedProduct: true })).toBe(true);
    expect(isMarkedLineMissingKm({ markedProduct: true, productMarks: ['KM'] })).toBe(false);
    expect(isMarkedLineMissingKm({ markedProduct: false })).toBe(false);
    expect(isMarkedLineMissingKm({ name: 'plain' })).toBe(false);
  });

  it('assertCartMarkedKmReady blocks cart with missing KM', () => {
    expect(assertCartMarkedKmReady([
      { markedProduct: false, quantity: 1 },
      { markedProduct: true, productMarks: ['A'] },
    ])).toEqual({ ok: true });

    expect(assertCartMarkedKmReady([
      { markedProduct: true, quantity: 1 },
      { markedProduct: true, productMarks: ['A'] },
    ])).toEqual({ ok: false, count: 1 });

    expect(cartMarkedLinesMissingKm([
      { markedProduct: true },
      { markedProduct: true },
    ])).toHaveLength(2);
  });
});
