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

  it('requires valid RRN', () => {
    const res = validateAndNormalizeCardDetails({ cardCategory: 'PERSONAL', rrn: '12' }, t);
    expect(res.ok).toBe(false);
    expect(res.field).toBe('rrn');
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
