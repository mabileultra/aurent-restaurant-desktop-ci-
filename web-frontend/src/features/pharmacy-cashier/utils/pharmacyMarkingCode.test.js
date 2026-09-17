import { describe, expect, it } from 'vitest';
import {
  extractGtinFromMarkingCode,
  isPharmacyMarkingCode,
  markingBarcodeCandidates,
  normalizePharmacyMarkingCode,
} from './pharmacyMarkingCode';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';

describe('pharmacyMarkingCode', () => {
  it('strips scanner AIM prefix before reading GTIN', () => {
    expect(normalizePharmacyMarkingCode(']d2010478001234567821SERIAL')).toBe('010478001234567821SERIAL');
    expect(extractGtinFromMarkingCode(`]d2${MARK}`)).toBe('04780012345678');
  });

  it('builds EAN-13 and GTIN-14 candidates from a DataMatrix', () => {
    expect(markingBarcodeCandidates(MARK)).toEqual(['04780012345678', '4780012345678']);
    expect(isPharmacyMarkingCode(MARK)).toBe(true);
  });

  it('does not treat a plain EAN-13 as a marking code', () => {
    expect(isPharmacyMarkingCode('4780012345678')).toBe(false);
  });

  it('reads GTIN from parenthesis AI and digit-only payloads', () => {
    expect(extractGtinFromMarkingCode('(01)03838989563233(21)ABC')).toBe('03838989563233');
    expect(extractGtinFromMarkingCode('010383898956323321999888777')).toBe('03838989563233');
    expect(markingBarcodeCandidates('010383898956323321SERIAL')).toContain('3838989563233');
  });
});
