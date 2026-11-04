import { describe, expect, it } from 'vitest';
import { isPharmacySpaPath } from './pharmacyAppRedirect';

describe('isPharmacySpaPath', () => {
  it('detects /pharm world', () => {
    expect(isPharmacySpaPath('/pharm')).toBe(true);
    expect(isPharmacySpaPath('/pharm/pos')).toBe(true);
    expect(isPharmacySpaPath('/pharmacy/stock/products')).toBe(true);
  });

  it('rejects grocery paths', () => {
    expect(isPharmacySpaPath('/cashier/pos')).toBe(false);
    expect(isPharmacySpaPath('/dashboard')).toBe(false);
  });
});
