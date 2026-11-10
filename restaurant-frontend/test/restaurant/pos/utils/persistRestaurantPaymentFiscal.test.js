import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ attachFiscal: vi.fn() }));

vi.mock('../../../../src/restaurant/api/payment.api', () => ({
  rstPaymentApi: api,
}));

const {
  toPaymentFiscalPayload,
  persistRestaurantPaymentFiscal,
} = await import('../../../../src/restaurant/pos/utils/persistRestaurantPaymentFiscal');

describe('persistRestaurantPaymentFiscal', () => {
  beforeEach(() => {
    api.attachFiscal.mockReset().mockResolvedValue({ data: { id: 'p1' } });
  });

  it('strips QR URL from payload', () => {
    const payload = toPaymentFiscalPayload({
      fiscalStatus: 'FISCALIZED',
      fiscalSign: 'SIGN1',
      fiscalReceiptSeq: '42',
      multikassaSaleId: 'mk-1',
      fiscalTerminalId: 'TERM1',
      fiscalQrUrl: 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=SIGN1&s=1',
    });
    expect(payload).toEqual({
      fiscalStatus: 'FISCALIZED',
      fiscalSign: 'SIGN1',
      fiscalReceiptSeq: '42',
      multikassaSaleId: 'mk-1',
      fiscalTerminalId: 'TERM1',
    });
    expect(payload).not.toHaveProperty('fiscalQrUrl');
  });

  it('skips tax-off / empty fiscal', () => {
    expect(toPaymentFiscalPayload(null)).toBeNull();
    expect(toPaymentFiscalPayload({ fiscalStatus: 'NOT_REQUIRED' })).toBeNull();
  });

  it('posts attach without throwing on API error', async () => {
    api.attachFiscal.mockRejectedValueOnce(new Error('offline'));
    await expect(
      persistRestaurantPaymentFiscal('o-1', {
        fiscalStatus: 'FISCALIZED',
        fiscalSign: 'S',
      }),
    ).resolves.toBeNull();
  });
});
