import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ pay: vi.fn() }));
const mk = vi.hoisted(() => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  loadMultikassaCapabilities: vi.fn(),
  resolveMultikassaFiscalErrorMessage: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((e) => e),
}));
const asl = vi.hoisted(() => ({
  getCashierCapabilities: vi.fn(),
}));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: api }));
vi.mock('../../../../src/services/multikassa', () => mk);
vi.mock('../../../../src/api/pharmacyIntegration.api', () => ({ pharmacyIntegrationApi: asl }));

const { payRestaurantOrderWithFiscal } = await import(
  '../../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal'
);

const markedOrder = {
  id: 'o-mark',
  channel: 'DINE_IN',
  subtotal: 10000,
  items: [{
    id: 'i1',
    name: 'Кола',
    quantity: 1,
    unitPrice: 10000,
    itemStatus: 'SERVED',
    markedProduct: true,
    ikpu: '123',
  }],
};

beforeEach(() => {
  api.pay.mockReset().mockResolvedValue({ data: { ...markedOrder, status: 'CLOSED' } });
  mk.loadMultikassaCapabilities.mockReset().mockResolvedValue({ enabled: true, requireBeforeSale: true });
  mk.fiscalizeSaleBeforeCommit.mockReset().mockResolvedValue({ fiscalStatus: 'FISCALIZED' });
  asl.getCashierCapabilities.mockReset();
});

describe('payRestaurantOrderWithFiscal — no ASL key', () => {
  it('does not fiscalize or pay a marked dish when the API key is missing', async () => {
    asl.getCashierCapabilities.mockResolvedValue({ data: { aslMarkingEnabled: false } });

    await expect(payRestaurantOrderWithFiscal({
      order: markedOrder,
      method: 'CASH',
      amount: 10000,
      storeId: 1,
    })).rejects.toMatchObject({ code: 'MARKING_NO_INTEGRATION' });

    expect(mk.fiscalizeSaleBeforeCommit).not.toHaveBeenCalled();
    expect(api.pay).not.toHaveBeenCalled();
  });
});
