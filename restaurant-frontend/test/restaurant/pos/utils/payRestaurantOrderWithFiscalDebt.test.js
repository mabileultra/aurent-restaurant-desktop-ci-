import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ pay: vi.fn() }));
const mk = vi.hoisted(() => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  loadMultikassaCapabilities: vi.fn(),
  resolveMultikassaFiscalErrorMessage: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((e) => e),
}));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: api }));
vi.mock('../../../../src/services/multikassa', () => mk);
vi.mock('../../../../src/services/multikassa/multikassaConstants', () => ({
  FISCAL_STATUS: { PENDING: 'PENDING', FISCALIZED: 'FISCALIZED' },
}));

const { payRestaurantOrderWithFiscal } = await import(
  '../../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal'
);

const order = {
  id: 'o-1',
  channel: 'DINE_IN',
  subtotal: 120000,
  items: [{ id: 'i1', name: 'Лагман', quantity: 4, unitPrice: 30000, itemStatus: 'SERVED' }],
};

beforeEach(() => {
  api.pay.mockReset().mockResolvedValue({ data: { ...order, status: 'CLOSED' } });
  mk.loadMultikassaCapabilities.mockReset().mockResolvedValue({ enabled: true, requireBeforeSale: true });
  mk.fiscalizeSaleBeforeCommit.mockReset();
});

describe('payRestaurantOrderWithFiscal — credit / advance', () => {
  it('sends phone, comment and advance to the API and skips fiscal', async () => {
    await payRestaurantOrderWithFiscal({
      order,
      method: 'ADVANCE',
      amount: 120000,
      debtPhone: '+998901112233',
      debtComment: 'банкет',
      advancePaid: 50000,
      storeId: 1,
      t: (k, o) => o?.defaultValue ?? k,
    });

    expect(mk.loadMultikassaCapabilities).not.toHaveBeenCalled();
    expect(mk.fiscalizeSaleBeforeCommit).not.toHaveBeenCalled();
    const [orderId, body] = api.pay.mock.calls[0];
    expect(orderId).toBe('o-1');
    expect(body).toMatchObject({
      method: 'ADVANCE',
      amount: 120000,
      cashAmount: 0,
      cardAmount: 0,
      debtPhone: '+998901112233',
      debtComment: 'банкет',
      advancePaid: 50000,
    });
  });

  it('sends credit details', async () => {
    await payRestaurantOrderWithFiscal({
      order,
      method: 'CREDIT',
      amount: 120000,
      debtPhone: '+998901112233',
      debtComment: null,
      storeId: 1,
    });

    const body = api.pay.mock.calls[0][1];
    expect(body.method).toBe('CREDIT');
    expect(body.debtPhone).toBe('+998901112233');
    expect(body.advancePaid).toBeNull();
  });

  it('does not leak debt fields into cash payments', async () => {
    mk.loadMultikassaCapabilities.mockResolvedValue({ enabled: false });

    await payRestaurantOrderWithFiscal({
      order,
      method: 'CASH',
      amount: 120000,
      amountTendered: 150000,
      debtPhone: '+998901112233',
      debtComment: 'x',
      advancePaid: 1,
      storeId: 1,
    });

    const body = api.pay.mock.calls[0][1];
    expect(body.method).toBe('CASH');
    expect(body.changeGiven).toBe(30000);
    expect(body).not.toHaveProperty('debtPhone');
    expect(body).not.toHaveProperty('debtComment');
    expect(body).not.toHaveProperty('advancePaid');
  });
});
