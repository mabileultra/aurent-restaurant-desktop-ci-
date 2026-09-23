import { describe, expect, it } from 'vitest';
import { matchPendingMarksToLines } from './pharmacyReceiptPendingMarksStore';

const KM1 = '010478001234567821AAAA91K1';
const KM2 = '010478001234567821AAAA91K2';
const KM9 = '010478001234567821AAAA91K9';

describe('matchPendingMarksToLines', () => {
  it('matches by product name', () => {
    const byLine = matchPendingMarksToLines(
      [{ id: 'L1', productName: 'Aspirin', markedProduct: true }],
      [{ excelName: 'Aspirin', markCodes: [KM1, KM2] }],
    );
    expect(byLine.L1).toEqual([
      { code: KM1, aslStatus: 'IMPORT' },
      { code: KM2, aslStatus: 'IMPORT' },
    ]);
  });

  it('matches by barcode/sku', () => {
    const byLine = matchPendingMarksToLines(
      [{ id: 'L2', sku: '478001', productName: 'X' }],
      [{ barcode: '478001', markCodes: [KM9] }],
    );
    expect(byLine.L2[0].code).toBe(KM9);
  });

  it('ignores Didox marked flag', () => {
    const byLine = matchPendingMarksToLines(
      [{ id: 'L3', productName: 'X', markedProduct: true }],
      [{ excelName: 'X', markCodes: ['Маркировкаланган'] }],
    );
    expect(byLine.L3).toBeUndefined();
  });
});
