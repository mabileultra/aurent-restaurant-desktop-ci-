import { describe, expect, it } from 'vitest';
import { measurePosCatalogLayout } from '../../../src/features/cashier/utils/measurePosCatalogLayout';

describe('measurePosCatalogLayout', () => {
  it('returns list fallback without host', () => {
    expect(measurePosCatalogLayout({ hostEl: null, viewMode: 'list' })).toEqual({
      columns: 1,
      rowHeight: 48,
    });
  });

  it('returns grid fallback without host', () => {
    expect(measurePosCatalogLayout({ hostEl: null, viewMode: 'grid' }).columns).toBe(1);
  });
});
