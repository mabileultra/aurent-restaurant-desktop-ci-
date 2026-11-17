import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fiscalMock = vi.hoisted(() => ({
  loadFiscalContext: vi.fn(),
  wrapFiscalError: vi.fn((err) => err),
}));

const apiMock = vi.hoisted(() => ({
  saleApi: { create: vi.fn() },
  pharmacySalesApi: { create: vi.fn() },
  categoryApi: { getAll: vi.fn() },
  productApi: { getAll: vi.fn(), getByBarcode: vi.fn() },
  cashierShiftApi: {},
  pharmacyWarehouseApi: {},
  pharmacyShiftApi: {},
}));

vi.mock('../fiscal', () => fiscalMock);
vi.mock('../api', () => apiMock);
vi.mock('../../features/marking', () => ({
  assertCartMarksNotPunched: vi.fn().mockResolvedValue(undefined),
}));

const { assertReceiptPrinterReady, resolveReceiptPrinterErrorMessage } = await import('./assertReceiptPrinterReady');
const { posCreateSale } = await import('../pos/posDataRouter');

describe('assertReceiptPrinterReady (pharmacy-frontend)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    fiscalMock.loadFiscalContext.mockReset();
    apiMock.pharmacySalesApi.create.mockReset();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('skips check in non-desktop browser environment', async () => {
    delete globalThis.window;
    await expect(assertReceiptPrinterReady()).resolves.toEqual({ ok: true, skipped: true });
  });

  it('throws NO_PRINTER before fiscalization and pharmacy sale API even when printReceipt is false', async () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        printReceiptEscpos: vi.fn(),
        checkReceiptPrinterReady: vi.fn().mockResolvedValue({
          ok: false,
          code: 'NO_PRINTER',
          printerName: '',
          message: 'Принтер чеков не подключён или не выбран.',
        }),
      },
    };

    await expect(
      posCreateSale({
        storeId: 15,
        catalogKind: 'pharmacy',
        payment: { paymentMethod: 'CASH', receiptType: 'SALE', printReceipt: false },
        user: { id: 1, fullName: 'Pharmacist' },
        cachedShift: { id: 22 },
        storeName: 'Аптека',
        getCheckoutLineItems: () => [{ productId: 5, quantity: 1, unitPrice: 8064 }],
        getCheckoutOrderDiscountAmount: () => 0,
        getCheckoutOrderDiscountPercent: () => 0,
        items: [{ productId: 5, quantity: 1, unitPrice: 8064 }],
      }),
    ).rejects.toMatchObject({
      code: 'NO_PRINTER',
      isReceiptPrinterError: true,
    });

    expect(fiscalMock.loadFiscalContext).not.toHaveBeenCalled();
    expect(apiMock.pharmacySalesApi.create).not.toHaveBeenCalled();
  });

  it('resolves i18n message for printer error codes', () => {
    const t = vi.fn((key, opts) => `${key}:${opts.defaultValue}`);
    expect(resolveReceiptPrinterErrorMessage({ code: 'DOOR_OPEN' }, t)).toContain('pos.receiptPrinterDoorOpen');
    expect(resolveReceiptPrinterErrorMessage({ code: 'PAPER_JAM' }, t)).toContain('pos.receiptPrinterPaperJam');
  });
});
