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

import { saleApi } from '../api';
import { loadFiscalContext } from '../fiscal';
import { resolvePosRoute } from './posRouteResolver';
import { posCreateSale } from './posDataRouter';

const PLAIN_ITEM = {
  lineId: 'line-1',
  productId: 10,
  name: 'Non',
  unitPrice: 5000,
  quantity: 2,
  taxRate: 12,
  discount: 0,
  discountPercent: 0,
};

function makeSaleArgs(payment) {
  return {
    storeId: 1,
    payment,
    user: { fullName: 'Kassir Sinov' },
    cachedShift: { id: 'shift-1' },
    items: [PLAIN_ITEM],
    getCheckoutLineItems: () => [
      { productId: 10, quantity: 2, unitPrice: 5000, lineTotal: 10000 },
    ],
    getCheckoutOrderDiscountAmount: () => 0,
    getCheckoutOrderDiscountPercent: () => 0,
  };
}

describe('posCreateSale: AUR-17 card payment attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePosRoute.mockReturnValue({ route: 'server', canFallback: false });
    loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: false, printFiscalQr: true },
      provider: {
        fiscalizeSale: vi.fn().mockResolvedValue(null),
      },
    });
    saleApi.create.mockResolvedValue({
      data: {
        id: 'sale-999',
        receiptNumber: 'CHK-999',
      },
    });
  });

  it('sends cardCategory, rrn, and socialCardNumber to backend when paying with card', async () => {
    const payment = {
      paymentMethod: 'CARD',
      receiptType: 'SALE',
      cardType: 'HUMO',
      cardCategory: 'SOCIAL',
      rrn: '123456789012',
      socialCardNumber: '9860********8031',
      cardAmount: 10000,
      amountTendered: 10000,
    };

    await posCreateSale(makeSaleArgs(payment));

    expect(saleApi.create).toHaveBeenCalledTimes(1);
    const sentPayload = saleApi.create.mock.calls[0][0];

    expect(sentPayload.cardCategory).toBe('SOCIAL');
    expect(sentPayload.rrn).toBe('123456789012');
    expect(sentPayload.socialCardNumber).toBe('9860********8031');
  });

  it('omits card details when cash payment is used', async () => {
    const payment = {
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      amountTendered: 10000,
      cashAmount: 10000,
    };

    await posCreateSale(makeSaleArgs(payment));

    expect(saleApi.create).toHaveBeenCalledTimes(1);
    const sentPayload = saleApi.create.mock.calls[0][0];

    expect(sentPayload.cardCategory).toBeUndefined();
    expect(sentPayload.rrn).toBeUndefined();
    expect(sentPayload.socialCardNumber).toBeUndefined();
  });
});
