import { describe, expect, it } from 'vitest';
import { storeIsPharmacy, storeSupportsAslMarking } from './storeAslMarkingSupport';

describe('storeAslMarkingSupport', () => {
  it('allows grocery universal construction pharmacy', () => {
    expect(storeSupportsAslMarking('GROCERY')).toBe(true);
    expect(storeSupportsAslMarking('universal')).toBe(true);
    expect(storeSupportsAslMarking('CONSTRUCTION')).toBe(true);
    expect(storeSupportsAslMarking('PHARMACY')).toBe(true);
  });

  it('rejects restaurant and empty', () => {
    expect(storeSupportsAslMarking('RESTAURANT')).toBe(false);
    expect(storeSupportsAslMarking('')).toBe(false);
    expect(storeSupportsAslMarking(null)).toBe(false);
  });

  it('detects pharmacy only', () => {
    expect(storeIsPharmacy('PHARMACY')).toBe(true);
    expect(storeIsPharmacy('GROCERY')).toBe(false);
  });
});
