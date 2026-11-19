import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ pay: vi.fn() }));
const mk = vi.hoisted(() => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  loadMultikassaCapabilities: vi.fn(),
  resolveMultikassaFiscalErrorMessage: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((e) => e),
}));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: api }));
vi.mock('../../../../src/restaurant/api/payment.api', () => ({
  rstPaymentApi: { attachFiscal: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock('../../../../src/services/multikassa', () => mk);
vi.mock('../../../../src/services/fiscal', () => ({
  FISCAL_STATUS: { PENDING: 'PENDING', FISCALIZED: 'FISCALIZED' },
  loadFiscalContext: vi.fn().mockResolvedValue({
    capabilities: { enabled: false },
    provider: {
      fiscalizeSale: vi.fn().mockResolvedValue(null),
      resolveErrorMessage: (err, t) => err?.message,
      wrapError: (err) => err,
    },
  }),
  resolveFiscalProvider: vi.fn().mockReturnValue({
    fiscalizeSale: vi.fn().mockResolvedValue(null),
    resolveErrorMessage: (err, t) => err?.message,
    wrapError: (err) => err,
  }),
}));

const { payRestaurantOrderWithFiscal } = await import(
  '../../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal'
);

const sampleOrder = {
  id: 'order-rest-101',
  channel: 'DINE_IN',
  subtotal: 80000,
  items: [{ id: 'item-1', name: 'Osh', quantity: 2, unitPrice: 40000, itemStatus: 'SERVED' }],
};

describe('payRestaurantOrderWithFiscal: AUR-17 card payment fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pay.mockReset().mockResolvedValue({ data: { ...sampleOrder, status: 'CLOSED' } });
  });

  it('sends cardCategory, rrn, and socialCardNumber to /orders/{orderId}/pay API', async () => {
    await payRestaurantOrderWithFiscal({
      order: sampleOrder,
      method: 'CARD',
      amount: 80000,
      cardType: 'HUMO',
      cardCategory: 'SOCIAL',
      rrn: '123456789012',
      socialCardNumber: '9860********8031',
      storeId: 1,
      t: (k, o) => o?.defaultValue ?? k,
    });

    expect(api.pay).toHaveBeenCalledTimes(1);
    const [orderId, body] = api.pay.mock.calls[0];

    expect(orderId).toBe('order-rest-101');
    expect(body.cardCategory).toBe('SOCIAL');
    expect(body.rrn).toBe('123456789012');
    expect(body.socialCardNumber).toBe('9860********8031');
  });

  it('omits card details when cash payment is used', async () => {
    await payRestaurantOrderWithFiscal({
      order: sampleOrder,
      method: 'CASH',
      amount: 80000,
      storeId: 1,
      t: (k, o) => o?.defaultValue ?? k,
    });

    expect(api.pay).toHaveBeenCalledTimes(1);
    const [orderId, body] = api.pay.mock.calls[0];

    expect(orderId).toBe('order-rest-101');
    expect(body.cardCategory).toBeUndefined();
    expect(body.rrn).toBeUndefined();
    expect(body.socialCardNumber).toBeUndefined();
  });
});
