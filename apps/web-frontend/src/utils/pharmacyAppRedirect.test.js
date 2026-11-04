import { describe, expect, it } from 'vitest';
import { isPharmacySpaPath, mapMainPathToPharmacyPath } from './pharmacyAppRedirect';

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

describe('mapMainPathToPharmacyPath', () => {
  it('maps pharm POS and stock to SPA paths', () => {
    expect(mapMainPathToPharmacyPath('/pharm/pos')).toBe('/pos');
    expect(mapMainPathToPharmacyPath('/pharm/stock/products')).toBe('/stock/products');
    expect(mapMainPathToPharmacyPath('/pharm/stock/receipts/1')).toBe('/stock/receipts/1');
  });

  it('defaults unknown to /pos', () => {
    expect(mapMainPathToPharmacyPath('/something-else')).toBe('/pos');
  });
});
