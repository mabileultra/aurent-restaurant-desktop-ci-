import { describe, expect, it } from 'vitest';
import { assessQtyMarkingScan } from './pharmacyQtyMarkingScan';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';
const product = {
  barcode: '4780012345678',
  barcodes: [],
};

describe('assessQtyMarkingScan', () => {
  it('accepts a new ASL mark and ignores a plain barcode', () => {
    const accepted = assessQtyMarkingScan({ product, rawCode: MARK, scans: [] });
    expect(accepted.status).toBe('accepted');
    expect(accepted.mark).toContain('0104780012345678');
    expect(assessQtyMarkingScan({ product, rawCode: '4780012345678' }).status).toBe('not-marking');
  });

  it('rejects a repeat, a sold code, a foreign GTIN and a stock overrun', () => {
    const first = assessQtyMarkingScan({ product, rawCode: MARK, scans: [] });
    expect(assessQtyMarkingScan({ product, rawCode: MARK, scans: [first] }).status).toBe('duplicate');
    expect(assessQtyMarkingScan({
      product,
      rawCode: MARK,
      aslResult: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    }).status).toBe('sold');
    expect(assessQtyMarkingScan({
      product,
      rawCode: MARK,
      aslResult: { found: true, gtin: '09990000000000' },
    }).status).toBe('mismatch');
    expect(assessQtyMarkingScan({
      product,
      rawCode: MARK,
      scans: [],
      stockPacks: 0.4,
    }).status).toBe('stock');
  });
});
