import { describe, expect, it } from 'vitest';
import { summarizePharmacyImportTasnif } from './summarizePharmacyImportTasnif';

describe('summarizePharmacyImportTasnif', () => {
  it('counts flags from match rows', () => {
    expect(summarizePharmacyImportTasnif([
      { markedProduct: true, ikpuStatus: 'FOUND', packageCode: '1546940', prescriptionRequired: true },
      { markedProduct: true, ikpuStatus: 'MANUAL', packageCode: '', prescriptionRequired: false },
      { markedProduct: false, ikpuStatus: 'FOUND', packageCode: '1' },
    ])).toEqual({
      total: 3,
      marked: 2,
      found: 2,
      manual: 1,
      pack: 2,
      rx: 1,
      otc: 1,
    });
  });
});
