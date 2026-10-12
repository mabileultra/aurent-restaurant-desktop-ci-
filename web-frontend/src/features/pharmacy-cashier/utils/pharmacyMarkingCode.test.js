import { describe, expect, it } from 'vitest';
import {
  extractGtinFromMarkingCode,
  isCompletePharmacyMarkingScan,
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

  it('strips euro / GS scanner separators', () => {
    expect(normalizePharmacyMarkingCode('010478001234567821SERIAL€91CRYPT')).toBe('010478001234567821SERIAL91CRYPT');
    expect(isPharmacyMarkingCode('010478001234567821SERIAL€91CRYPT')).toBe(true);
    expect(isCompletePharmacyMarkingScan('010478001234567821SERIAL€91CRYPT')).toBe(true);
  });

  it('builds EAN-13 and GTIN-14 candidates from a DataMatrix', () => {
    const candidates = markingBarcodeCandidates(MARK);
    expect(candidates).toContain('04780012345678');
    expect(candidates).toContain('4780012345678');
    expect(isPharmacyMarkingCode(MARK)).toBe(true);
  });

  it('maps zero-padded GTIN-14 to EAN-8 in the product card', () => {
    const candidates = markingBarcodeCandidates('0100000047804357217xv.2/=z0yd2Fku');
    expect(candidates).toContain('00000047804357');
    expect(candidates).toContain('47804357');
  });

  it('does not treat a plain EAN-13 as a marking code', () => {
    expect(isPharmacyMarkingCode('4780012345678')).toBe(false);
    expect(isCompletePharmacyMarkingScan('4780012345678')).toBe(false);
  });

  it('does not treat IKPU/MXIK or Didox flag as a marking QR', () => {
    expect(isPharmacyMarkingCode('03004409005039001')).toBe(false);
    expect(isPharmacyMarkingCode('01004409005039001')).toBe(false);
    expect(isPharmacyMarkingCode('Маркировкаланган')).toBe(false);
    expect(isPharmacyMarkingCode('010478001234567821SERIAL91X')).toBe(true);
  });

  it('reads GTIN from parenthesis AI and digit-only payloads', () => {
    expect(extractGtinFromMarkingCode('(01)03838989563233(21)ABC')).toBe('03838989563233');
    expect(extractGtinFromMarkingCode('010383898956323321999888777')).toBe('03838989563233');
    expect(markingBarcodeCandidates('010383898956323321SERIAL')).toContain('3838989563233');
  });

  it('reads GTIN after scanner junk before AI 01', () => {
    expect(extractGtinFromMarkingCode('XX010478001234567821SERIAL')).toBe('04780012345678');
  });

  it('detects complete marking scan for auto-submit', () => {
    expect(isCompletePharmacyMarkingScan(MARK)).toBe(true);
    expect(isCompletePharmacyMarkingScan('01')).toBe(false);
  });
});
