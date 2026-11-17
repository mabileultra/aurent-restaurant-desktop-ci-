import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const orderApi = vi.hoisted(() => ({ pay: vi.fn() }));
const fiscal = vi.hoisted(() => ({
  loadFiscalContext: vi.fn(),
  resolveFiscalProvider: vi.fn(),
  FISCAL_STATUS: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING_FISCAL',
    FISCALIZED: 'FISCALIZED',
    FAILED: 'FISCAL_FAILED',
  },
}));

vi.mock('../../../src/restaurant/api/order.api', () => ({ rstOrderApi: orderApi }));
vi.mock('../../../src/services/fiscal', () => fiscal);
vi.mock('../../../src/restaurant/pos/utils/pendingFiscalQueue', () => ({
  enqueuePendingFiscal: vi.fn(),
}));

const {
  assertReceiptPrinterReady,
  resolveReceiptPrinterErrorMessage,
} = await import('../../../src/services/cashierEscpos/assertReceiptPrinterReady');
const {
  payRestaurantOrderWithFiscal,
} = await import('../../../src/restaurant/pos/utils/payRestaurantOrderWithFiscal');

describe('assertReceiptPrinterReady (restaurant-frontend)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    orderApi.pay.mockReset();
    fiscal.loadFiscalContext.mockReset();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('skips check outside desktop environment', async () => {
    delete globalThis.window;
    await expect(assertReceiptPrinterReady()).resolves.toEqual({ ok: true, skipped: true });
  });

  it('blocks payRestaurantOrderWithFiscal before fiscalization and payment API when NO_PAPER', async () => {
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
      payRestaurantOrderWithFiscal({
        order: {
          id: 'ord-1',
          subtotal: 50000,
          items: [{ id: '1', name: 'Плов', quantity: 1, unitPrice: 50000, ikpu: '01709001001000000' }],
        },
        method: 'CASH',
        amount: 50000,
        storeId: 1,
        storeName: 'Rest',
      }),
    ).rejects.toMatchObject({
      code: 'NO_PAPER',
      isReceiptPrinterError: true,
    });

    expect(fiscal.loadFiscalContext).not.toHaveBeenCalled();
    expect(orderApi.pay).not.toHaveBeenCalled();
  });

  it('resolves i18n message for offline and paper errors', () => {
    const t = vi.fn((key, opts) => `${key}:${opts.defaultValue}`);
    expect(resolveReceiptPrinterErrorMessage({ code: 'PRINTER_OFFLINE' }, t)).toContain('pos.receiptPrinterOffline');
    expect(resolveReceiptPrinterErrorMessage({ code: 'NO_PAPER' }, t)).toContain('pos.receiptPrinterNoPaper');
  });
});
