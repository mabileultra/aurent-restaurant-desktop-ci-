import { describe, expect, it } from 'vitest';
import {
  barcodeLookupVariants,
  ean13FromPackGtin14,
  extractGtinFromMarkingCode,
  gtinPackagingIndicator,
  isCompleteMarkingScan,
  isMarkingCode,
  markingBarcodeCandidates,
  normalizeMarkingCode,
} from './markingCode.js';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';

describe('@aurent/shared-marking markingCode', () => {
  it('strips scanner AIM prefix before reading GTIN', () => {
    expect(normalizeMarkingCode(']d2010478001234567821SERIAL')).toBe('010478001234567821SERIAL');
    expect(extractGtinFromMarkingCode(`]d2${MARK}`)).toBe('04780012345678');
  });

  it('strips euro / GS scanner separators', () => {
    expect(normalizeMarkingCode('010478001234567821SERIAL€91CRYPT')).toBe('010478001234567821SERIAL91CRYPT');
    expect(isMarkingCode('010478001234567821SERIAL€91CRYPT')).toBe(true);
    expect(isCompleteMarkingScan('010478001234567821SERIAL€91CRYPT')).toBe(true);
  });

  it('strips ↔ (U+2194) the same as GS — Filatoff / Didox scanner layout', () => {
    const withArrow = '0104780021711739217hhgo*h\u219493guia';
    const withGs = '0104780021711739217hhgo*h\u001d93guia';
    expect(normalizeMarkingCode(withArrow)).toBe('0104780021711739217hhgo*h93guia');
    expect(normalizeMarkingCode(withGs)).toBe('0104780021711739217hhgo*h93guia');
    expect(isMarkingCode(withArrow)).toBe(true);
  });

  it('reads GTIN-14 packaging indicator (0=piece, 1+=pack)', () => {
    expect(gtinPackagingIndicator('04780131183003')).toBe(0);
    expect(gtinPackagingIndicator('14780131183003')).toBe(1);
    expect(gtinPackagingIndicator(extractGtinFromMarkingCode('0114780131183003217Mj=?rFdu+Eg+\u2194931vcj'))).toBe(1);
    expect(gtinPackagingIndicator('478013118300')).toBeNull();
  });

  it('maps pack GTIN-14 to consumer EAN-13 on the product card', () => {
    expect(ean13FromPackGtin14('14780131183003')).toBe('4780131183006');
    const candidates = markingBarcodeCandidates('0114780131183003217Mj=?rFdu+Eg+\u2194931vcj');
    expect(candidates).toContain('4780131183006');
    expect(barcodeLookupVariants('14780131183003')).toContain('4780131183006');
  });

  it('builds EAN-13 and GTIN-14 candidates from a DataMatrix', () => {
    const candidates = markingBarcodeCandidates(MARK);
    expect(candidates).toContain('04780012345678');
    expect(candidates).toContain('4780012345678');
    expect(isMarkingCode(MARK)).toBe(true);
  });

  it('maps zero-padded GTIN-14 to EAN-8 in the product card', () => {
    const candidates = markingBarcodeCandidates('0100000047804357217xv.2/=z0yd2Fku');
    expect(candidates).toContain('00000047804357');
    expect(candidates).toContain('47804357');
  });

  it('reads GTIN-14 when scanner omits AI 01 (bare mark + serial)', () => {
    const bare = '000000478043577xv.2/=z0yd2Fku';
    expect(extractGtinFromMarkingCode(bare)).toBe('00000047804357');
    expect(markingBarcodeCandidates(bare)).toContain('47804357');
    expect(isMarkingCode(bare)).toBe(true);
  });

  it('does not treat a plain EAN-13 as a marking code', () => {
    expect(isMarkingCode('4780012345678')).toBe(false);
    expect(isCompleteMarkingScan('4780012345678')).toBe(false);
  });

  it('does not treat OFD receipt QR as a marking code', () => {
    const ofd = 'https://ofd.soliq.uz/check?t=ZZ000000000000&r=3&c=20240904094538&s=320262508539';
    expect(isMarkingCode(ofd)).toBe(false);
    expect(isCompleteMarkingScan(ofd)).toBe(false);
  });

  it('does not treat IKPU/MXIK or Didox flag as a marking QR', () => {
    expect(isMarkingCode('03004409005039001')).toBe(false);
    expect(isMarkingCode('01004409005039001')).toBe(false);
    expect(isMarkingCode('Маркировкаланган')).toBe(false);
    expect(isMarkingCode('010478001234567821SERIAL91X')).toBe(true);
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
    expect(isCompleteMarkingScan(MARK)).toBe(true);
    expect(isCompleteMarkingScan('01')).toBe(false);
  });
});
