import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  categoryApi: {},
  productApi: {},
  cashierShiftApi: {},
  pharmacyWarehouseApi: {},
  pharmacyShiftApi: {},
  saleApi: { create: vi.fn() },
  pharmacySalesApi: { create: vi.fn() },
}));
vi.mock('../../api/cashierTerminal.api', () => ({ cashierTerminalApi: {} }));
vi.mock('../fiscal', () => ({
  loadFiscalContext: vi.fn(),
  wrapFiscalError: (err) => err,
}));
vi.mock('../../features/marking', () => ({ assertCartMarksNotPunched: vi.fn() }));
vi.mock('./offlineCheckout', () => ({ processOfflineCheckout: vi.fn() }));
vi.mock('./posRouteResolver', () => ({ resolvePosRoute: vi.fn() }));
vi.mock('../offline/desktopOfflineBridge', () => ({
  isDesktopOfflineBridge: vi.fn(() => false),
  offlineGetProductByBarcode: vi.fn(),
  offlineListCategories: vi.fn(),
  offlineSearchProducts: vi.fn(),
  offlineGetCurrentShift: vi.fn(),
  offlineOpenShift: vi.fn(),
  offlineCloseShift: vi.fn(),
  offlineSyncShiftFromServer: vi.fn(),
  offlineListMySales: vi.fn(),
}));
vi.mock('../../store/connectivityStore', () => ({
  useConnectivityStore: { getState: vi.fn(() => ({})) },
}));

import { PRESCRIPTION_NUMBER_REQUIRED_CODE } from '@aurent/shared-fiscal';
import { pharmacySalesApi, saleApi } from '../api';
import { loadFiscalContext } from '../fiscal';
import { processOfflineCheckout } from './offlineCheckout';
import { resolvePosRoute } from './posRouteResolver';
import { posCreateSale } from './posDataRouter';

const RX_LINE = {
  lineId: 'rx-1',
  productId: 2,
  name: 'Amoksitsillin',
  unitPrice: 12000,
  quantity: 1,
  taxRate: 12,
  discount: 0,
  discountPercent: 0,
  requiresPrescription: true,
};
const PLAIN_LINE = { ...RX_LINE, lineId: 'plain-1', productId: 1, name: 'Vitamin C', requiresPrescription: false };
const VALID_NUMBER = 'RX-2026/0042';

function createSaleArgs(payment, items = [RX_LINE]) {
  return {
    storeId: 7,
    payment,
    user: { fullName: 'Kassir' },
    cachedShift: { id: 1 },
    storeName: 'Dorixona',
    getCheckoutLineItems: () => items.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    getCheckoutOrderDiscountAmount: () => 0,
    getCheckoutOrderDiscountPercent: () => 0,
    items,
    catalogKind: 'pharmacy',
  };
}

async function captureError(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe('posCreateSale: electronic prescription number (AUR-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePosRoute.mockReturnValue({ route: 'remote', canFallback: false });
    loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: false, printFiscalQr: true },
      provider: { fiscalizeSale: vi.fn().mockResolvedValue(null) },
    });
    pharmacySalesApi.create.mockResolvedValue({ data: { id: 99, receiptNumber: 'PHR-1' } });
    saleApi.create.mockResolvedValue({ data: { id: 98, receiptNumber: 'CHK-1' } });
  });

  it.each([
    ['cash', { paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 12000 }],
    ['card', { paymentMethod: 'CARD', receiptType: 'SALE', cardType: 'HUMO', amountTendered: 12000 }],
    ['mixed', { paymentMethod: 'MIXED', receiptType: 'SALE', cashAmount: 2000, cardAmount: 10000 }],
    ['credit (nasiya)', { paymentMethod: 'CASH', receiptType: 'CREDIT', customerId: 5 }],
  ])('online: blocks %s sale without a prescription number before fiscalization', async (_label, payment) => {
    const error = await captureError(posCreateSale(createSaleArgs(payment)));

    expect(error?.code).toBe(PRESCRIPTION_NUMBER_REQUIRED_CODE);
    expect(loadFiscalContext).not.toHaveBeenCalled();
    expect(pharmacySalesApi.create).not.toHaveBeenCalled();
    expect(saleApi.create).not.toHaveBeenCalled();
  });

  it('offline: blocks the sale without a prescription number, nothing is saved locally', async () => {
    resolvePosRoute.mockReturnValue({ route: 'local', canFallback: false });

    const error = await captureError(
      posCreateSale(createSaleArgs({ paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 12000 })),
    );

    expect(error?.code).toBe(PRESCRIPTION_NUMBER_REQUIRED_CODE);
    expect(processOfflineCheckout).not.toHaveBeenCalled();
    expect(loadFiscalContext).not.toHaveBeenCalled();
  });

  it('sells with a number: it is attached to the receipt but NOT sent to the backend', async () => {
    const res = await posCreateSale(
      createSaleArgs({
        paymentMethod: 'CASH',
        receiptType: 'SALE',
        amountTendered: 12000,
        prescriptionNumber: VALID_NUMBER,
      }),
    );

    expect(pharmacySalesApi.create).toHaveBeenCalledTimes(1);
    const sentPayload = pharmacySalesApi.create.mock.calls[0][0];
    expect(sentPayload).not.toHaveProperty('prescriptionNumber');
    expect(JSON.stringify(sentPayload)).not.toContain(VALID_NUMBER);
    expect(res.data.prescriptionNumber).toBe(VALID_NUMBER);
  });

  it('does not ask for a number when the cart has no prescription drugs', async () => {
    const res = await posCreateSale(
      createSaleArgs({ paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 12000 }, [PLAIN_LINE]),
    );

    expect(pharmacySalesApi.create).toHaveBeenCalledTimes(1);
    expect(res.data.prescriptionNumber).toBeUndefined();
  });
});
