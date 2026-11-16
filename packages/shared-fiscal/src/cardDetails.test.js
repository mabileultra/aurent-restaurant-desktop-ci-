import { describe, expect, it } from 'vitest';
import { CARD_CATEGORY } from '@aurent/shared-types';
import {
  buildFiscalDriveCardFields,
  buildMultikassaCardFields,
  extractCardReceiptDetails,
  isValidRrn,
  isValidSocialCardInput,
  maskSocialCardNumber,
  normalizeCardCategory,
  normalizeRrn,
  toOfdCardTypeCode,
  withCardReceiptDetails,
} from './cardDetails.js';

describe('@aurent/shared-fiscal cardDetails', () => {
  it('normalizes card categories and maps OFD codes (1/2/3 and string values)', () => {
    // 1/2/3 numeric and string codes
    expect(normalizeCardCategory(1)).toBe(CARD_CATEGORY.CORPORATE);
    expect(normalizeCardCategory(2)).toBe(CARD_CATEGORY.PERSONAL);
    expect(normalizeCardCategory(3)).toBe(CARD_CATEGORY.SOCIAL);
    expect(normalizeCardCategory('1')).toBe(CARD_CATEGORY.CORPORATE);
    expect(normalizeCardCategory('2')).toBe(CARD_CATEGORY.PERSONAL);
    expect(normalizeCardCategory('3')).toBe(CARD_CATEGORY.SOCIAL);

    // Named string values
    expect(normalizeCardCategory('corporate')).toBe(CARD_CATEGORY.CORPORATE);
    expect(normalizeCardCategory('PERSONAL')).toBe(CARD_CATEGORY.PERSONAL);
    expect(normalizeCardCategory('Social')).toBe(CARD_CATEGORY.SOCIAL);

    // Invalid values
    expect(normalizeCardCategory('UZCARD')).toBeNull();
    expect(normalizeCardCategory(null)).toBeNull();
    expect(normalizeCardCategory(undefined)).toBeNull();
    expect(normalizeCardCategory('')).toBeNull();

    // OFD code mapping
    expect(toOfdCardTypeCode(CARD_CATEGORY.CORPORATE)).toBe(1);
    expect(toOfdCardTypeCode(CARD_CATEGORY.PERSONAL)).toBe(2);
    expect(toOfdCardTypeCode(CARD_CATEGORY.SOCIAL)).toBe(3);
    expect(toOfdCardTypeCode('UNKNOWN')).toBeNull();
  });

  it('masks social card numbers: 16 digits, with spaces/hyphens, pre-masked, short (<8), and null', () => {
    // 16 digits without spaces
    expect(maskSocialCardNumber('8600123456789012')).toBe('8600********9012');

    // 16 digits with spaces and hyphens
    expect(maskSocialCardNumber('8600 1234-5678 9012')).toBe('8600********9012');
    expect(maskSocialCardNumber(' 9860-1234-5678-9012 ')).toBe('9860********9012');

    // Already masked from terminal slip receipts
    expect(maskSocialCardNumber('986003******8031:01')).toBe('9860********8031');
    expect(maskSocialCardNumber('986003******1946')).toBe('9860********1946');
    expect(maskSocialCardNumber('9860 **** **** 8031')).toBe('9860********8031');
    expect(maskSocialCardNumber('98608031')).toBe('9860********8031');

    // Shorter than 8 digits returns null
    expect(maskSocialCardNumber('123456')).toBeNull();
    expect(maskSocialCardNumber('123')).toBeNull();

    // Null and undefined
    expect(maskSocialCardNumber(null)).toBeNull();
    expect(maskSocialCardNumber(undefined)).toBeNull();
    expect(maskSocialCardNumber('')).toBeNull();

    // Validation helper
    expect(isValidSocialCardInput('986003******8031')).toBe(true);
    expect(isValidSocialCardInput('8600 1234 5678 9012')).toBe(true);
    expect(isValidSocialCardInput('123')).toBe(false);
    expect(isValidSocialCardInput(null)).toBe(false);
  });

  it('validates RRN strictly: 12 digits passes; 11, 13, mixed letters fail', () => {
    // 12 digits passes
    expect(isValidRrn('631810177451')).toBe(true);
    expect(isValidRrn(' 6318 1017-7451 ')).toBe(true);
    expect(normalizeRrn(' 6318 1017-7451 ')).toBe('631810177451');

    // 11 digits fails
    expect(isValidRrn('12345678901')).toBe(false);

    // 13 digits fails
    expect(isValidRrn('1234567890123')).toBe(false);

    // Mixed letters fail
    expect(isValidRrn('63181017745A')).toBe(false);
    expect(isValidRrn('rrn-ab12')).toBe(false);
    expect(isValidRrn('ABC123456789')).toBe(false);

    // Empty and null fail
    expect(isValidRrn(null)).toBe(false);
    expect(isValidRrn(undefined)).toBe(false);
    expect(isValidRrn('')).toBe(false);
    expect(isValidRrn('   ')).toBe(false);
    expect(normalizeRrn('   ')).toBeNull();
  });

  it('extracts and merges card receipt details preserving server values first', () => {
    const details = extractCardReceiptDetails({
      cardType: 'UZCARD',
      cardCategory: 'SOCIAL',
      rrn: '631810177451',
      socialCardNumber: '986003******8031:01',
    });
    expect(details).toEqual({
      cardCategory: 'SOCIAL',
      cardTypeCode: 3,
      rrn: '631810177451',
      socialCardNumber: '9860********8031',
    });

    const merged = withCardReceiptDetails(
      { id: 10, cardType: 'HUMO' },
      { cardCategory: 'PERSONAL', rrn: '631811236997' },
    );
    expect(merged).toEqual({
      id: 10,
      cardType: 'HUMO',
      cardCategory: 'PERSONAL',
      rrn: '631811236997',
    });
  });

  it('builds Multikassa and FiscalDrive card fields with masked card number', () => {
    const payment = {
      paymentMethod: 'CARD',
      cardType: 'HUMO',
      cardCategory: CARD_CATEGORY.SOCIAL,
      rrn: '631810177451',
      socialCardNumber: '986003******8031:01',
    };

    expect(buildMultikassaCardFields(payment, 3000)).toEqual({
      card_type: 3,
      ppt_id: '631810177451',
      card_number: '9860********8031',
    });

    expect(buildFiscalDriveCardFields(payment, 3000)).toEqual({
      CardType: 3,
      PPTID: '631810177451',
      CardNumber: '9860********8031',
    });

    expect(buildMultikassaCardFields({ paymentMethod: 'CASH' }, 0)).toEqual({});
  });
});
