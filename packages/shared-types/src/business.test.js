import { describe, expect, it } from 'vitest';
import { BUSINESS_TYPE, isPharmacyBusinessType } from './business.js';

describe('@aurent/shared-types business', () => {
  it('detects pharmacy', () => {
    expect(isPharmacyBusinessType('pharmacy')).toBe(true);
    expect(isPharmacyBusinessType(BUSINESS_TYPE.GROCERY)).toBe(false);
  });
});
