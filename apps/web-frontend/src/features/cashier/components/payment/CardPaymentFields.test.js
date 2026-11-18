import { describe, expect, it } from 'vitest';
import {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from './CardPaymentFields';

const t = (key, opts) => opts?.defaultValue || key;

describe('validateAndNormalizeCardDetails', () => {
  it('defaults to PERSONAL category', () => {
    expect(createInitialCardDetails()).toEqual({
      cardCategory: 'PERSONAL',
      rrn: '',
      socialCardInput: '',
    });
  });

  it('requires valid 12-digit RRN (rejects short, long, mixed letters)', () => {
    // 2 digits fails
    const resShort = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '12' }, t);
    expect(resShort.ok).toBe(false);
    expect(resShort.field).toBe('rrn');
    expect(resShort.error).toBe('Введите код RRN (ровно 12 цифр)');

    // 11 digits fails
    const res11 = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '12345678901' }, t);
    expect(res11.ok).toBe(false);
    expect(res11.field).toBe('rrn');

    // 13 digits fails
    const res13 = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '1234567890123' }, t);
    expect(res13.ok).toBe(false);
    expect(res13.field).toBe('rrn');

    // mixed letters fail
    const resLetters = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '63181017745A' }, t);
    expect(resLetters.ok).toBe(false);
    expect(resLetters.field).toBe('rrn');

    // exactly 12 digits passes
    const res12 = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '631810177451' }, t);
    expect(res12.ok).toBe(true);
    expect(res12.data.rrn).toBe('631810177451');
  });

  it('requires and masks social card number for SOCIAL category', () => {
    const bad = validateAndNormalizeCardDetails(
      { cardCategory: 'SOCIAL', rrn: '631810177451', socialCardInput: '123' },
      t,
    );
    expect(bad.ok).toBe(false);
    expect(bad.field).toBe('socialCardInput');

    const good = validateAndNormalizeCardDetails(
      { cardCategory: 'SOCIAL', rrn: '6318-1017-7451', socialCardInput: '986003******8031' },
      t,
    );
    expect(good).toEqual({
      ok: true,
      data: {
        cardCategory: 'SOCIAL',
        rrn: '631810177451',
        socialCardNumber: '9860********8031',
      },
    });
  });
});
