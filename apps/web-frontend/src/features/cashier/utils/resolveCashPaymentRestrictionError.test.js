import { describe, expect, it } from 'vitest';
import { resolveCashPaymentRestrictionError } from './resolveCashPaymentRestrictionError';

describe('resolveCashPaymentRestrictionError', () => {
  const t = (key, opts) => `${key}:${opts?.limit ?? ''}`;

  it('maps reasonCode from API context', () => {
    const msg = resolveCashPaymentRestrictionError(
      {
        response: {
          data: {
            message: 'server',
            context: { reasonCode: 'CASH_PAYMENT_AMOUNT_LIMIT', cashPaymentLimitSoum: '25160000' },
          },
        },
      },
      t,
    );
    expect(msg).toBe('pos.cashPaymentAmountLimit:25160000');
  });

  it('returns null for unrelated errors', () => {
    expect(resolveCashPaymentRestrictionError({ message: 'boom' }, t)).toBeNull();
  });
});
