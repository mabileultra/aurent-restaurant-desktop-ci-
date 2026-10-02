import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ pay: vi.fn() }));
const mk = vi.hoisted(() => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  loadMultikassaCapabilities: vi.fn(),
  resolveMultikassaFiscalErrorMessage: vi.fn((e) => e?.message),
  wrapMultikassaFiscalError: vi.fn((e) => e),
}));
const offline = vi.hoisted(() => ({
  isRestaurantLocalFirstDesktop: vi.fn(() => true),
  isRestaurantOfflineBridge: vi.fn(() => true),
  rstOfflinePayOrder: vi.fn(),
}));
const activity = vi.hoisted(() => ({
  logLocalFirst: vi.fn(),
}));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: api }));
vi.mock('../../../../src/services/multikassa', () => mk);
vi.mock('../../../../src/services/multikassa/multikassaConstants', () => ({
  FISCAL_STATUS: { PENDING: 'PENDING', FISCALIZED: 'FISCALIZED' },
}));
vi.mock('../../../../src/services/offline/restaurantOfflineBridge', () => offline);
vi.mock('../../../../src/services/desktop/activityLog', () => activity);

const { payRestaurantOrderWithFiscal } = await import(
  '../../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal'
);

const order = {
  id: 'o-local-1',
  channel: 'DINE_IN',
  subtotal: 50000,
  items: [{ id: 'i1', name: 'Чай', quantity: 1, unitPrice: 50000, itemStatus: 'SENT_TO_KITCHEN' }],
};

beforeEach(() => {
  api.pay.mockReset();
  mk.loadMultikassaCapabilities.mockReset().mockResolvedValue({ enabled: false });
  mk.fiscalizeSaleBeforeCommit.mockReset();
  offline.isRestaurantLocalFirstDesktop.mockReset().mockReturnValue(true);
  offline.isRestaurantOfflineBridge.mockReset().mockReturnValue(true);
  offline.rstOfflinePayOrder.mockReset().mockResolvedValue({
    order: { ...order, status: 'PAID', _local: true },
  });
  activity.logLocalFirst.mockReset();
});

describe('payRestaurantOrderWithFiscal — local-first fallback', () => {
  it('falls back to local pay when API fails and local-first is on', async () => {
    api.pay.mockRejectedValue(new Error('network_down'));

    const result = await payRestaurantOrderWithFiscal({
      order,
      method: 'CASH',
      amount: 50000,
      storeId: 1,
      t: (k, o) => o?.defaultValue ?? k,
    });

    expect(offline.rstOfflinePayOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'o-local-1',
        method: 'CASH',
        amount: 50000,
      }),
    );
    expect(result.order.status).toBe('PAID');
    expect(activity.logLocalFirst).toHaveBeenCalled();
  });

  it('rethrows API error when local-first is off', async () => {
    offline.isRestaurantLocalFirstDesktop.mockReturnValue(false);
    api.pay.mockRejectedValue(new Error('network_down'));

    await expect(
      payRestaurantOrderWithFiscal({
        order,
        method: 'CASH',
        amount: 50000,
        storeId: 1,
      }),
    ).rejects.toThrow('network_down');
    expect(offline.rstOfflinePayOrder).not.toHaveBeenCalled();
  });

  it('rethrows when local pay also fails', async () => {
    api.pay.mockRejectedValue(new Error('network_down'));
    offline.rstOfflinePayOrder.mockRejectedValue(new Error('local_db_down'));

    await expect(
      payRestaurantOrderWithFiscal({
        order,
        method: 'CASH',
        amount: 50000,
        storeId: 1,
      }),
    ).rejects.toThrow('network_down');
  });
});
