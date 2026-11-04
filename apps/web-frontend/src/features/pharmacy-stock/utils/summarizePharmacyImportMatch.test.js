import { describe, expect, it } from 'vitest';
import { summarizePharmacyImportMatch } from './summarizePharmacyImportMatch';

describe('summarizePharmacyImportMatch', () => {
  it('counts tones and selected rows', () => {
    expect(summarizePharmacyImportMatch([
      { ikpuStatus: 'FOUND', markedProduct: true, packageCode: '1546940', selected: true },
      { ikpuStatus: 'FOUND', markedProduct: true, packageCode: '', selected: true },
      { ikpuStatus: 'MANUAL', selected: false },
      { status: 'DUPLICATE', selected: true },
    ])).toEqual({
      total: 4,
      found: 1,
      partial: 1,
      missing: 1,
      duplicate: 1,
      selected: 2,
    });
  });
});
