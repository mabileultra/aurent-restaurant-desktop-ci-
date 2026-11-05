import { describe, expect, it } from 'vitest';
import { isPharmacyTenant } from './businessScope.js';

describe('@aurent/shared-tenant', () => {
  it('reads profile object', () => {
    expect(isPharmacyTenant({ businessTypeCode: 'PHARMACY' })).toBe(true);
    expect(isPharmacyTenant({ defaultTypeCode: 'GROCERY' })).toBe(false);
  });
});
