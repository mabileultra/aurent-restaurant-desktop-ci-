import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../store/connectivityStore', () => ({
  refreshConnectivityStatus: vi.fn().mockResolvedValue(undefined),
  useConnectivityStore: { getState: vi.fn() },
}));
vi.mock('../offline/connectivityRules', () => ({ hasLocalPosCatalog: vi.fn() }));
vi.mock('../offline/desktopOfflineBridge', () => ({
  isDesktopOfflineBridge: vi.fn(),
  offlineCompleteCheckout: vi.fn(),
}));
vi.mock('../desktop/activityLog', () => ({ logSale: vi.fn() }));

import { PRESCRIPTION_NUMBER_REQUIRED_CODE } from '@aurent/shared-fiscal';
import { useConnectivityStore } from '../../store/connectivityStore';
import { hasLocalPosCatalog } from '../offline/connectivityRules';
import { isDesktopOfflineBridge, offlineCompleteCheckout } from '../offline/desktopOfflineBridge';
import { processOfflineCheckout } from './offlineCheckout';

const RX_LINE = {
  lineId: 'rx-1',
  productId: 2,
  name: 'Amoksitsillin',
  saleType: 'PIECE',
  unitCode: 'PCS',
  unitPrice: 12000,
  quantity: 1,
  taxRate: 12,
  discount: 0,
  discountPercent: 0,
  attributes: { prescription_required: 'true' },
};
const VALID_NUMBER = 'RX-2026/0042';

function offlineArgs(payment) {
  return {
    storeId: 7,
    payment,
    user: { id: 12, fullName: 'Kassir' },
    cachedShift: { id: 'shift-1', openedAt: '2026-11-13T08:00:00Z', status: 'OPEN' },
    storeName: 'Dorixona',
    getCheckoutOrderDiscountAmount: () => 0,
    getCheckoutOrderDiscountPercent: () => 0,
    items: [RX_LINE],
  };
}

describe('processOfflineCheckout: electronic prescription number (AUR-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConnectivityStore.getState.mockReturnValue({ storeId: 7, bootstrapReady: true });
    isDesktopOfflineBridge.mockReturnValue(true);
    hasLocalPosCatalog.mockReturnValue(true);
    offlineCompleteCheckout.mockResolvedValue({
      clientSaleId: 'sale-1',
      receiptNumber: 'OFF-20261113-0001',
    });
  });

  it('offline: blocks a prescription drug without a number, nothing is saved', async () => {
    await expect(
      processOfflineCheckout(offlineArgs({ paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 12000 })),
    ).rejects.toMatchObject({ code: PRESCRIPTION_NUMBER_REQUIRED_CODE });
    expect(offlineCompleteCheckout).not.toHaveBeenCalled();
  });

  it('offline: with a number the receipt gets it, the sync payload does not', async () => {
    const res = await processOfflineCheckout(
      offlineArgs({
        paymentMethod: 'CASH',
        receiptType: 'SALE',
        amountTendered: 12000,
        prescriptionNumber: VALID_NUMBER,
      }),
    );

    expect(offlineCompleteCheckout).toHaveBeenCalledTimes(1);
    const { payload } = offlineCompleteCheckout.mock.calls[0][0];
    expect(payload).not.toHaveProperty('prescriptionNumber');
    expect(JSON.stringify(payload)).not.toContain(VALID_NUMBER);
    expect(res.data.prescriptionNumber).toBe(VALID_NUMBER);
  });
});
