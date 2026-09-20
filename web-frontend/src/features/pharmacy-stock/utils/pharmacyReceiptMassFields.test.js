import { describe, expect, it } from 'vitest';
import {
  PHARM_RECEIPT_MASS_FIELDS,
  PHARM_RECEIPT_MASS_NUMERIC,
  PHARM_RECEIPT_MASS_PRICE_FIELDS,
} from './pharmacyReceiptMassFields';

describe('pharmacyReceiptMassFields', () => {
  it('includes units in pack for draft mass edit', () => {
    expect(PHARM_RECEIPT_MASS_FIELDS.map((f) => f.id)).toContain('UNITS_IN_PACK');
    expect(PHARM_RECEIPT_MASS_NUMERIC.has('UNITS_IN_PACK')).toBe(true);
  });

  it('keeps units out of posted price-only list', () => {
    expect(PHARM_RECEIPT_MASS_PRICE_FIELDS.map((f) => f.id)).not.toContain('UNITS_IN_PACK');
  });
});
