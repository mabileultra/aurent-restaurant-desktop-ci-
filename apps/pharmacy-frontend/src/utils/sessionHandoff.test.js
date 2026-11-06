import { describe, expect, it } from 'vitest';
import { safePharmacyNextPath } from './sessionHandoff';

describe('safePharmacyNextPath', () => {
  it('allows absolute in-app paths', () => {
    expect(safePharmacyNextPath('/pos')).toBe('/pos');
    expect(safePharmacyNextPath('/stock/products')).toBe('/stock/products');
  });

  it('rejects open redirects', () => {
    expect(safePharmacyNextPath('https://evil.test')).toBe('');
    expect(safePharmacyNextPath('//evil.test')).toBe('');
    expect(safePharmacyNextPath('pos')).toBe('');
  });
});
