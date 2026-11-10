import { beforeEach, describe, expect, it, vi } from 'vitest';

const orderApi = vi.hoisted(() => ({ pay: vi.fn() }));
const paymentApi = vi.hoisted(() => ({ attachFiscal: vi.fn() }));
const fiscal = vi.hoisted(() => ({
  loadFiscalContext: vi.fn(),
  resolveFiscalProvider: vi.fn(),
  FISCAL_STATUS: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING_FISCAL',
    FISCALIZED: 'FISCALIZED',
    FAILED: 'FISCAL_FAILED',
  },
}));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: orderApi }));
vi.mock('../../../../src/restaurant/api/payment.api', () => ({ rstPaymentApi: paymentApi }));
vi.mock('../../../../src/api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: { getCashierCapabilities: vi.fn() },
}));
vi.mock('../../../../src/services/fiscal', () => fiscal);
vi.mock('../../../../src/restaurant/pos/utils/pendingFiscalQueue', () => ({
  enqueuePendingFiscal: vi.fn(),
}));

const { payRestaurantOrderWithFiscal } = await import(
  '../../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal'
);

const order = {
  id: 'o-pay',
  channel: 'DINE_IN',
  subtotal: 35000,
  items: [{
    id: 'i1',
    name: 'Лагман',
    quantity: 1,
    unitPrice: 35000,
    itemStatus: 'SERVED',
    ikpu: '01709001001000000',
    packageCode: '1501228',
  }],
};

beforeEach(() => {
  orderApi.pay.mockReset().mockResolvedValue({ data: { ...order, status: 'CLOSED' } });
  paymentApi.attachFiscal.mockReset().mockResolvedValue({ data: { id: 'p1' } });
  fiscal.loadFiscalContext.mockReset();
  fiscal.resolveFiscalProvider.mockReset();
});

describe('payRestaurantOrderWithFiscal — persist proof without QR', () => {
  it('attaches fiscalized proof without fiscalQrUrl', async () => {
    const provider = {
      fiscalizeSale: vi.fn().mockResolvedValue({
        fiscalStatus: 'FISCALIZED',
        fiscalSign: '848035748636',
        fiscalReceiptSeq: '583',
        multikassaSaleId: 'mk-1',
        fiscalQrUrl: 'https://ofd.soliq.uz/check?t=TERM&r=583&c=20230526204523&s=848035748636',
        fiscalTerminalId: 'UZ190912014310',
      }),
      resolveErrorMessage: vi.fn(),
      wrapError: (e) => e,
    };
    fiscal.loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: true, requireBeforeSale: false },
      provider,
    });

    await payRestaurantOrderWithFiscal({
      order,
      method: 'CASH',
      amount: 35000,
      storeId: 1,
      storeName: 'Test',
      t: (k) => k,
    });

    expect(paymentApi.attachFiscal).toHaveBeenCalledTimes(1);
    const [, body] = paymentApi.attachFiscal.mock.calls[0];
    expect(body).toEqual({
      fiscalStatus: 'FISCALIZED',
      fiscalSign: '848035748636',
      fiscalReceiptSeq: '583',
      multikassaSaleId: 'mk-1',
      fiscalTerminalId: 'UZ190912014310',
    });
    expect(body).not.toHaveProperty('fiscalQrUrl');
  });

  it('tax off → does not call attachFiscal', async () => {
    fiscal.loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: false },
      provider: fiscal.resolveFiscalProvider(null),
    });
    fiscal.resolveFiscalProvider.mockReturnValue({
      fiscalizeSale: vi.fn(),
      resolveErrorMessage: vi.fn(),
      wrapError: (e) => e,
    });

    await payRestaurantOrderWithFiscal({
      order,
      method: 'CASH',
      amount: 35000,
      storeId: 1,
      t: (k) => k,
    });

    expect(paymentApi.attachFiscal).not.toHaveBeenCalled();
  });
});
