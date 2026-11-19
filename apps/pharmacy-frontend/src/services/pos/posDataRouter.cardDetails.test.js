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

import { pharmacySalesApi } from '../api';
import { loadFiscalContext } from '../fiscal';
import { resolvePosRoute } from './posRouteResolver';
import { posCreateSale } from './posDataRouter';

const PLAIN_MEDICINE = {
  lineId: 'line-1',
  productId: 101,
  name: 'Paratsetamol',
  unitPrice: 5000,
  quantity: 1,
  taxRate: 12,
  discount: 0,
  discountPercent: 0,
  requiresPrescription: false,
};

function makeSaleArgs(payment) {
  return {
    storeId: 2,
    catalogKind: 'pharmacy',
    payment,
    user: { fullName: 'Farmatsevt Sinov' },
    cachedShift: { id: 'shift-pharm-1' },
    items: [PLAIN_MEDICINE],
    getCheckoutLineItems: () => [
      { productId: 101, quantity: 1, unitPrice: 5000, lineTotal: 5000 },
    ],
    getCheckoutOrderDiscountAmount: () => 0,
    getCheckoutOrderDiscountPercent: () => 0,
  };
}

describe('pharmacy posCreateSale: AUR-17 card payment attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePosRoute.mockReturnValue({ route: 'server', canFallback: false });
    loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: false, printFiscalQr: true },
      provider: {
        fiscalizeSale: vi.fn().mockResolvedValue(null),
      },
    });
    pharmacySalesApi.create.mockResolvedValue({
      data: {
        id: 'pharm-sale-1',
        receiptNumber: 'PHR-001',
      },
    });
  });

  it('sends cardCategory, rrn, and socialCardNumber to pharmacy API', async () => {
    const payment = {
      paymentMethod: 'CARD',
      receiptType: 'SALE',
      cardType: 'UZCARD',
      cardCategory: 'SOCIAL',
      rrn: '987654321098',
      socialCardNumber: '8600********4321',
      cardAmount: 5000,
      amountTendered: 5000,
    };

    await posCreateSale(makeSaleArgs(payment));

    expect(pharmacySalesApi.create).toHaveBeenCalledTimes(1);
    const sentPayload = pharmacySalesApi.create.mock.calls[0][0];

    expect(sentPayload.cardCategory).toBe('SOCIAL');
    expect(sentPayload.rrn).toBe('987654321098');
    expect(sentPayload.socialCardNumber).toBe('8600********4321');
  });

  it('omits card details when cash payment is used', async () => {
    const payment = {
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      amountTendered: 5000,
      cashAmount: 5000,
    };

    await posCreateSale(makeSaleArgs(payment));

    expect(pharmacySalesApi.create).toHaveBeenCalledTimes(1);
    const sentPayload = pharmacySalesApi.create.mock.calls[0][0];

    expect(sentPayload.cardCategory).toBeUndefined();
    expect(sentPayload.rrn).toBeUndefined();
    expect(sentPayload.socialCardNumber).toBeUndefined();
  });
});
