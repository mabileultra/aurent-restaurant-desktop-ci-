import { describe, expect, it } from 'vitest';
import {
  flattenReceiptMarks,
  receiptMarksReady,
  requiredMarkCountForLine,
} from './pharmacyReceiptMarks';

describe('pharmacyReceiptMarks', () => {
  it('requires ceil qty marks for marked lines only', () => {
    expect(requiredMarkCountForLine({ markedProduct: false, quantity: 5 })).toBe(0);
    expect(requiredMarkCountForLine({ markedProduct: true, quantity: 2.1 })).toBe(3);
  });

  it('reports missing marks', () => {
    const lines = [
      { id: 'a', productId: 'p1', productName: 'A', markedProduct: true, quantity: 2 },
      { id: 'b', productId: 'p2', productName: 'B', markedProduct: false, quantity: 5 },
    ];
    const ready = receiptMarksReady(lines, { a: [{ code: 'x' }] });
    expect(ready.ok).toBe(false);
    expect(ready.missing[0].need).toBe(2);
    expect(ready.missing[0].have).toBe(1);
  });

  it('flattens marks for activate payload', () => {
    const lines = [{ id: 'a', productId: 'p1', markedProduct: true, quantity: 1 }];
    expect(flattenReceiptMarks({ a: [{ code: 'KM1', aslStatus: 'OK' }] }, lines)).toEqual([
      { productId: 'p1', receiptLineId: 'a', markCode: 'KM1', aslStatus: 'OK' },
    ]);
  });
});
