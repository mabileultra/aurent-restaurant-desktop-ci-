import { describe, expect, it } from 'vitest';
import { resolvePharmacyScanFocusTarget } from './resolvePharmacyScanFocusTarget';

describe('resolvePharmacyScanFocusTarget', () => {
  it('prefers KM when preferKm and KM field exists', () => {
    expect(
      resolvePharmacyScanFocusTarget({
        preferKm: true,
        kmFocused: false,
        hasKm: true,
        hasSearch: true,
      }),
    ).toBe('km');
  });

  it('keeps KM when KM already focused', () => {
    expect(
      resolvePharmacyScanFocusTarget({
        preferKm: false,
        kmFocused: true,
        hasKm: true,
        hasSearch: true,
      }),
    ).toBe('km');
  });

  it('falls back to product search after qty/pay when KM not preferred', () => {
    expect(
      resolvePharmacyScanFocusTarget({
        preferKm: false,
        kmFocused: false,
        hasKm: true,
        hasSearch: true,
      }),
    ).toBe('search');
  });

  it('uses KM when search field missing', () => {
    expect(
      resolvePharmacyScanFocusTarget({
        preferKm: false,
        kmFocused: false,
        hasKm: true,
        hasSearch: false,
      }),
    ).toBe('km');
  });

  it('returns null when no fields mounted', () => {
    expect(resolvePharmacyScanFocusTarget({})).toBeNull();
  });
});
