import { describe, expect, it } from 'vitest';
import { CARD_CATEGORY } from '@aurent/shared-types';
import {
  buildFiscalDriveCardFields,
  buildMultikassaCardFields,
  extractCardReceiptDetails,
  isValidSocialCardInput,
  maskSocialCardNumber,
  normalizeCardCategory,
  normalizeRrn,
  toOfdCardTypeCode,
  withCardReceiptDetails,
} from './cardDetails.js';

describe('@aurent/shared-fiscal cardDetails', () => {
  it('normalizes card categories and maps OFD codes', () => {
    expect(normalizeCardCategory('corporate')).toBe(CARD_CATEGORY.CORPORATE);
    expect(normalizeCardCategory('PERSONAL')).toBe(CARD_CATEGORY.PERSONAL);
    expect(normalizeCardCategory(3)).toBe(CARD_CATEGORY.SOCIAL);
    expect(normalizeCardCategory('UZCARD')).toBeNull();

    expect(toOfdCardTypeCode(CARD_CATEGORY.CORPORATE)).toBe(1);
    expect(toOfdCardTypeCode(CARD_CATEGORY.PERSONAL)).toBe(2);
    expect(toOfdCardTypeCode(CARD_CATEGORY.SOCIAL)).toBe(3);
    expect(toOfdCardTypeCode('UNKNOWN')).toBeNull();
  });

  it('masks full and pre-masked social card numbers keeping first 4 and last 4 digits', () => {
    expect(maskSocialCardNumber('8600 1234 5678 9012')).toBe('8600********9012');
    expect(maskSocialCardNumber('986003******8031:01')).toBe('9860********8031');
    expect(maskSocialCardNumber('986003******1946')).toBe('9860********1946');
    expect(maskSocialCardNumber('9860 **** **** 8031')).toBe('9860********8031');
    expect(maskSocialCardNumber('98608031')).toBe('9860********8031');
    expect(maskSocialCardNumber('123456')).toBeNull();
    expect(isValidSocialCardInput('986003******8031')).toBe(true);
    expect(isValidSocialCardInput('123')).toBe(false);
  });

  it('normalizes RRN cleanly', () => {
    expect(normalizeRrn(' 6318 1017-7451 ')).toBe('631810177451');
    expect(normalizeRrn('rrn-ab12')).toBe('RRNAB12');
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

  it('builds Multikassa and FiscalDrive card fields for fiscal modules', () => {
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
