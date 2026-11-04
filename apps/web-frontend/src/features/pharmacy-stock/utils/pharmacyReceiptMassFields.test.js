import { describe, expect, it } from 'vitest';
import {
  PHARM_RECEIPT_MASS_FIELDS,
  PHARM_RECEIPT_MASS_NUMERIC,
} from './pharmacyReceiptMassFields';

describe('pharmacyReceiptMassFields', () => {
  it('includes all editable line columns for mass edit', () => {
    expect(PHARM_RECEIPT_MASS_FIELDS.map((f) => f.id)).toEqual([
      'QUANTITY',
      'UNITS_IN_PACK',
      'PURCHASE',
      'VAT',
      'MARKUP',
      'RETAIL',
      'BATCH',
      'EXPIRY',
    ]);
    expect(PHARM_RECEIPT_MASS_NUMERIC.has('UNITS_IN_PACK')).toBe(true);
  });
});
