import { describe, expect, it } from 'vitest';
import { storeIsPharmacy, storeSupportsAslMarking } from './storeAslMarkingSupport';

describe('storeAslMarkingSupport', () => {
  it('allows grocery universal construction pharmacy', () => {
    expect(storeSupportsAslMarking('GROCERY')).toBe(true);
    expect(storeSupportsAslMarking('universal')).toBe(true);
    expect(storeSupportsAslMarking('CONSTRUCTION')).toBe(true);
    expect(storeSupportsAslMarking('PHARMACY')).toBe(true);
  });

  it('allows restaurant and canteen', () => {
    expect(storeSupportsAslMarking('RESTAURANT')).toBe(true);
    expect(storeSupportsAslMarking('CANTEEN')).toBe(true);
  });

  it('rejects unsupported types and empty', () => {
    expect(storeSupportsAslMarking('SERVICES')).toBe(false);
    expect(storeSupportsAslMarking('OTHER')).toBe(false);
    expect(storeSupportsAslMarking('')).toBe(false);
    expect(storeSupportsAslMarking(null)).toBe(false);
  });

  it('detects pharmacy only', () => {
    expect(storeIsPharmacy('PHARMACY')).toBe(true);
    expect(storeIsPharmacy('GROCERY')).toBe(false);
  });
});
