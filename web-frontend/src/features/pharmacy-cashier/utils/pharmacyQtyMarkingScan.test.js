import { describe, expect, it } from 'vitest';
import { assessQtyMarkingScan } from './pharmacyQtyMarkingScan';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';
const product = {
  id: 'p1',
  barcode: '4780012345678',
  barcodes: [],
};

describe('assessQtyMarkingScan — надёжная проверка', () => {
  it('accepts a new ASL mark and ignores a plain barcode', () => {
    const accepted = assessQtyMarkingScan({ product, rawCode: MARK, scans: [] });
    expect(accepted.status).toBe('accepted');
    expect(accepted.mark).toContain('0104780012345678');
    expect(assessQtyMarkingScan({ product, rawCode: '4780012345678' }).status).toBe('not-marking');
  });

  it('accepts when ASL says not found but GTIN matches the product', () => {
    const result = assessQtyMarkingScan({
      product: { barcode: '3838989563233' },
      rawCode: '010383898956323321SERIAL91CRYPT',
      aslResult: { found: false },
    });
    expect(result.status).toBe('accepted');
  });

  it('accepts when ASL is null/offline but GTIN matches', () => {
    expect(assessQtyMarkingScan({
      product,
      rawCode: MARK,
      aslResult: null,
    }).status).toBe('accepted');
  });

  it('never returns not-found in qty modal — wrong GTIN is mismatch', () => {
    const result = assessQtyMarkingScan({
      product,
      rawCode: '010999000000000021SERIAL91CRYPT',
      aslResult: { found: false },
    });
    expect(result.status).toBe('mismatch');
    expect(result.status).not.toBe('not-found');
  });

  it('rejects a repeat, a sold code, a foreign ASL GTIN and a stock overrun', () => {
    const first = assessQtyMarkingScan({ product, rawCode: MARK, scans: [] });
    expect(assessQtyMarkingScan({ product, rawCode: MARK, scans: [first] }).status).toBe('duplicate');
    expect(assessQtyMarkingScan({
      product,
      rawCode: MARK,
      aslResult: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    }).status).toBe('sold');
    expect(assessQtyMarkingScan({
      product: { id: 'other', barcode: '4780131182498' },
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

  it('accepts EAN-13 product barcode against GTIN-14 in DataMatrix', () => {
    expect(assessQtyMarkingScan({
      product: { barcode: '4780012345678' },
      rawCode: '010478001234567821ABC\u001d93XYZ',
      aslResult: { found: false },
    }).status).toBe('accepted');
  });
});
