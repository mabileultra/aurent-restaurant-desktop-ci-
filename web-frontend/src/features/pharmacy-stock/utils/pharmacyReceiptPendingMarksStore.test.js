import { describe, expect, it } from 'vitest';
import { matchPendingMarksToLines } from './pharmacyReceiptPendingMarksStore';

describe('matchPendingMarksToLines', () => {
  it('matches by product name', () => {
    const byLine = matchPendingMarksToLines(
      [{ id: 'L1', productName: 'Aspirin', markedProduct: true }],
      [{ excelName: 'Aspirin', markCodes: ['KM1', 'KM2'] }],
    );
    expect(byLine.L1).toEqual([
      { code: 'KM1', aslStatus: 'IMPORT' },
      { code: 'KM2', aslStatus: 'IMPORT' },
    ]);
  });

  it('matches by barcode/sku', () => {
    const byLine = matchPendingMarksToLines(
      [{ id: 'L2', sku: '478001', productName: 'X' }],
      [{ barcode: '478001', markCodes: ['KM9'] }],
    );
    expect(byLine.L2[0].code).toBe('KM9');
  });
});
