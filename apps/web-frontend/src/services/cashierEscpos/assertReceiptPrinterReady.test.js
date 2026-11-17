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

describe('assertReceiptPrinterReady (web-frontend)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    fiscalMock.loadFiscalContext.mockReset();
    apiMock.saleApi.create.mockReset();
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

  it('skips check when desktop shell has no checkReceiptPrinterReady bridge', async () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        printReceiptEscpos: vi.fn(),
      },
    };
    await expect(assertReceiptPrinterReady()).resolves.toEqual({ ok: true, skipped: true });
  });

  it('throws localized printer error when NO_PAPER and skips fiscalization and sale creation', async () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        printReceiptEscpos: vi.fn(),
        checkReceiptPrinterReady: vi.fn().mockResolvedValue({
          ok: false,
          code: 'NO_PAPER',
          printerName: 'XP-80C',
          message: 'В чековом принтере закончилась бумага.',
        }),
      },
    };

    await expect(
      posCreateSale({
        storeId: 1,
        payment: { paymentMethod: 'CASH', receiptType: 'SALE', printReceipt: false },
        user: { id: 1, fullName: 'Cashier' },
        cachedShift: { id: 10 },
        storeName: 'Main',
        getCheckoutLineItems: () => [{ productId: 1, quantity: 1, unitPrice: 1000 }],
        getCheckoutOrderDiscountAmount: () => 0,
        getCheckoutOrderDiscountPercent: () => 0,
        items: [{ productId: 1, quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toMatchObject({
      code: 'NO_PAPER',
      isReceiptPrinterError: true,
    });

    expect(fiscalMock.loadFiscalContext).not.toHaveBeenCalled();
    expect(apiMock.saleApi.create).not.toHaveBeenCalled();
  });

  it('resolves i18n message for NO_PRINTER and NO_PAPER', () => {
    const t = vi.fn((key, opts) => `${key}:${opts.defaultValue}`);
    expect(resolveReceiptPrinterErrorMessage({ code: 'NO_PRINTER' }, t)).toContain('pos.receiptPrinterNotFound');
    expect(resolveReceiptPrinterErrorMessage({ code: 'NO_PAPER' }, t)).toContain('pos.receiptPrinterNoPaper');
  });
});
