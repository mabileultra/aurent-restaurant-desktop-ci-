import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../store/connectivityStore', () => ({
  refreshConnectivityStatus: vi.fn().mockResolvedValue(undefined),
  useConnectivityStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../offline/connectivityRules', () => ({
  hasLocalPosCatalog: vi.fn(),
}));

vi.mock('../offline/desktopOfflineBridge', () => ({
  isDesktopOfflineBridge: vi.fn(),
  offlineCompleteCheckout: vi.fn(),
}));

vi.mock('../desktop/activityLog', () => ({
  logSale: vi.fn(),
}));

import { useConnectivityStore } from '../../store/connectivityStore';
import { hasLocalPosCatalog } from '../offline/connectivityRules';
import {
  isDesktopOfflineBridge,
  offlineCompleteCheckout,
} from '../offline/desktopOfflineBridge';
import {
  buildOfflineStockLines,
  processOfflineCheckout,
} from './offlineCheckout';

describe('buildOfflineStockLines', () => {
  it('aggregates quantities by productId with 3-decimal precision and skips invalid lines', () => {
    const result = buildOfflineStockLines([
      { productId: 101, quantity: 0.1 },
      { productId: '101', quantity: 0.2 },
      { productId: 102, quantity: 0 },
      { productId: 103, quantity: -1 },
      { productId: null, quantity: 2 },
      { productId: 104, quantity: 1.5 },
    ]);

    expect(result).toEqual([
      { productId: 101, quantity: 0.3 },
      { productId: 104, quantity: 1.5 },
    ]);
  });
});

describe('processOfflineCheckout', () => {
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

  it('decreases local stock in pack fractions when selling pharmacy items by piece', async () => {
    const pieceLine = {
      lineId: 'line-1',
      productId: 501,
      name: 'Парацетамол 500мг',
      sku: 'PAR-500',
      saleType: 'PIECE',
      unitCode: 'PCS',
      unitPrice: 500,
      packUnitPrice: 5000,
      unitsInPack: 10,
      pharmacySellByPiece: true,
      quantity: 5,
      taxRate: 12,
      discount: 0,
      discountPercent: 0,
    };

    const res = await processOfflineCheckout({
      storeId: 7,
      payment: { paymentMethod: 'CASH', receiptType: 'SALE', amountTendered: 2500 },
      user: { id: 12, fullName: 'Кассир Аптеки' },
      cachedShift: { id: 'shift-1', openedAt: '2026-11-13T08:00:00Z', status: 'OPEN' },
      storeName: 'Аптека №1',
      getCheckoutOrderDiscountAmount: () => 0,
      getCheckoutOrderDiscountPercent: () => 0,
      items: [pieceLine],
    });

    expect(offlineCompleteCheckout).toHaveBeenCalledTimes(1);
    const callArg = offlineCompleteCheckout.mock.calls[0][0];

    expect(callArg.payload.items[0].quantity).toBe(0.5);
    expect(callArg.payload.items[0].unitPrice).toBe(5000);
    expect(callArg.stockLines).toEqual([{ productId: 501, quantity: 0.5 }]);

    expect(res.data.items[0].quantity).toBe(5);
    expect(res.data.items[0].unitPrice).toBe(500);
    expect(res.data.totalAmount).toBe(2500);
  });

  it('correctly builds stockLines for mixed packs, pieces, marked packs and weight items', async () => {
    const items = [
      {
        lineId: 'l-pack',
        productId: 10,
        name: 'Амоксиклав',
        saleType: 'PIECE',
        unitCode: 'PCS',
        unitPrice: 40000,
        unitsInPack: 10,
        pharmacySellByPiece: false,
        quantity: 1,
        taxRate: 12,
        discount: 0,
        discountPercent: 0,
      },
      {
        lineId: 'l-piece',
        productId: 10,
        name: 'Амоксиклав',
        saleType: 'PIECE',
        unitCode: 'PCS',
        unitPrice: 4000,
        packUnitPrice: 40000,
        unitsInPack: 10,
        pharmacySellByPiece: true,
        quantity: 2,
        taxRate: 12,
        discount: 0,
        discountPercent: 0,
      },
      {
        lineId: 'l-marked',
        productId: 20,
        name: 'Нурофен',
        saleType: 'PIECE',
        unitCode: 'PCS',
        unitPrice: 35000,
        markedProduct: true,
        productMarks: ['km-1', 'km-2'],
        quantity: 2,
        taxRate: 12,
        discount: 0,
        discountPercent: 0,
      },
      {
        lineId: 'l-weight',
        productId: 30,
        name: 'Спирт этиловый',
        saleType: 'WEIGHT',
        unitCode: 'L',
        unitPrice: 20000,
        quantity: 0.25,
        taxRate: 12,
        discount: 0,
        discountPercent: 0,
      },
    ];

    await processOfflineCheckout({
      storeId: 7,
      payment: { paymentMethod: 'CARD', receiptType: 'SALE' },
      user: { id: 12, username: 'cashier1' },
      cachedShift: { id: 'shift-1', status: 'OPEN' },
      storeName: 'Аптека №1',
      getCheckoutOrderDiscountAmount: () => 0,
      getCheckoutOrderDiscountPercent: () => 0,
      items,
    });

    const callArg = offlineCompleteCheckout.mock.calls[0][0];
    expect(callArg.stockLines).toEqual([
      { productId: 10, quantity: 1.2 },
      { productId: 20, quantity: 2 },
      { productId: 30, quantity: 0.25 },
    ]);
  });

  it('throws OFFLINE_SALE_SAVE_FAILED when desktop bridge or local catalog is unavailable', async () => {
    isDesktopOfflineBridge.mockReturnValue(false);

    await expect(
      processOfflineCheckout({
        storeId: 7,
        payment: { paymentMethod: 'CASH' },
        user: { id: 1 },
        cachedShift: null,
        storeName: '',
        getCheckoutOrderDiscountAmount: () => 0,
        getCheckoutOrderDiscountPercent: () => 0,
        items: [],
      }),
    ).rejects.toThrow('OFFLINE_SALE_SAVE_FAILED');
    expect(offlineCompleteCheckout).not.toHaveBeenCalled();

    isDesktopOfflineBridge.mockReturnValue(true);
    hasLocalPosCatalog.mockReturnValue(false);

    await expect(
      processOfflineCheckout({
        storeId: 7,
        payment: { paymentMethod: 'CASH' },
        user: { id: 1 },
        cachedShift: null,
        storeName: '',
        getCheckoutOrderDiscountAmount: () => 0,
        getCheckoutOrderDiscountPercent: () => 0,
        items: [],
      }),
    ).rejects.toThrow('OFFLINE_SALE_SAVE_FAILED');
    expect(offlineCompleteCheckout).not.toHaveBeenCalled();
  });
});

