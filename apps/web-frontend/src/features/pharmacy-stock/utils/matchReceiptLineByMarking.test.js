import { describe, expect, it } from 'vitest';
import { matchReceiptLineByMarking } from './matchReceiptLineByMarking';

const MARK = '010478001234567821SERIAL123';

describe('matchReceiptLineByMarking', () => {
  it('picks the marked line whose barcode matches GTIN and still needs KM', () => {
    const lines = [
      { id: 'full', productId: 'p1', barcode: '4780012345678', markedProduct: true, quantity: 1 },
      { id: 'need', productId: 'p2', barcode: '4780012345678', markedProduct: true, quantity: 2 },
      { id: 'other', productId: 'p3', barcode: '9990000000000', markedProduct: true, quantity: 1 },
    ];
    const hit = matchReceiptLineByMarking(lines, MARK, [], {
      full: [{ code: 'already' }],
    });
    expect(hit.id).toBe('need');
  });

  it('ignores unmarked lines', () => {
    const lines = [
      { id: 'plain', productId: 'p1', barcode: '4780012345678', markedProduct: false, quantity: 5 },
    ];
    expect(matchReceiptLineByMarking(lines, MARK)).toBeNull();
  });
});
