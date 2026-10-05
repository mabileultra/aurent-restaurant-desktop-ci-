import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./printShiftItemsReceipt', () => ({
  printShiftItemsReceipt: vi.fn(),
}));

vi.mock('../../../services/cashierEscpos', () => ({
  isCashierEscposReportPrintAvailable: vi.fn(() => true),
  printReportEscpos: vi.fn(),
}));

const { printShiftItemsReceipt } = await import('./printShiftItemsReceipt');
const { isCashierEscposReportPrintAvailable, printReportEscpos } = await import('../../../services/cashierEscpos');
const {
  printSoldItemsOnShiftClose,
  printCloseShiftReports,
  shiftCloseItemsReport,
} = await import('./shiftCloseItemsReport');

const items = [{ name: 'Молоко', quantity: 2, amount: 14000 }];

beforeEach(() => {
  printShiftItemsReceipt.mockReset();
  printShiftItemsReceipt.mockResolvedValue({ mode: 'silent' });
  printReportEscpos.mockReset();
  printReportEscpos.mockResolvedValue({ ok: true });
  isCashierEscposReportPrintAvailable.mockReset();
  isCashierEscposReportPrintAvailable.mockReturnValue(true);
});

describe('shiftCloseItemsReport', () => {
  it('maps the close payload for product and pharmacy', () => {
    expect(shiftCloseItemsReport({
      storeName: 'Аптека',
      cashierName: 'Азиза',
      closedAt: '2026-10-01T13:00:00Z',
      soldItems: {
        from: '2026-10-01T05:00:00Z',
        to: '2026-10-01T13:00:00Z',
        items,
      },
    })).toEqual({
      items,
      storeName: 'Аптека',
      cashierName: 'Азиза',
      openedAt: '2026-10-01T05:00:00Z',
      reportAt: '2026-10-01T13:00:00Z',
    });
  });

  it('falls back to the modal names and the shift close time', () => {
    expect(shiftCloseItemsReport(
      { soldItems: { items }, closedAt: '2026-10-01T13:00:00Z' },
      { storeName: 'Филиал', cashierName: 'Тимур' },
    )).toMatchObject({
      storeName: 'Филиал',
      cashierName: 'Тимур',
      reportAt: '2026-10-01T13:00:00Z',
    });
  });

  it('does not print an offline close that has no goods payload', () => {
    expect(shiftCloseItemsReport({ id: 'shift', status: 'CLOSED' })).toBeNull();
    expect(shiftCloseItemsReport({ soldItems: { items: null } })).toBeNull();
    expect(shiftCloseItemsReport(null)).toBeNull();
  });

  it('still prints an empty slip when the shift had no sales', () => {
    expect(shiftCloseItemsReport({ soldItems: { items: [], from: 'a', to: 'b' } }).items).toEqual([]);
  });
});

describe('printSoldItemsOnShiftClose', () => {
  it('prints the mapped slip', async () => {
    const closed = {
      storeName: 'Магазин',
      cashierName: 'Азиза',
      soldItems: { from: 'a', to: 'b', items },
    };

    const res = await printSoldItemsOnShiftClose(closed, { t: (key) => key });

    expect(res).toEqual({ printed: true, mode: 'silent' });
    expect(printShiftItemsReceipt).toHaveBeenCalledTimes(1);
    expect(printShiftItemsReceipt.mock.calls[0][0].report.items).toEqual(items);
    expect(printShiftItemsReceipt.mock.calls[0][0].report.storeName).toBe('Магазин');
  });

  it('skips printing when the close response has no slip', async () => {
    const res = await printSoldItemsOnShiftClose({ status: 'CLOSED' }, {});
    expect(res).toEqual({ printed: false });
    expect(printShiftItemsReceipt).not.toHaveBeenCalled();
  });

  it('rejects when the printer fails so the modal can toast and still finish close', async () => {
    printShiftItemsReceipt.mockRejectedValue(new Error('принтер занят'));
    await expect(printSoldItemsOnShiftClose({
      soldItems: { items, from: 'a', to: 'b' },
    }, {})).rejects.toThrow('принтер занят');
  });
});

describe('printCloseShiftReports', () => {
  it('prints Z first then the sold-items slip for pharmacy and grocery', async () => {
    const closed = {
      id: 'shift-1',
      storeName: 'Магазин',
      cashierName: 'Азиза',
      openedAt: '2026-10-05T05:00:00Z',
      closedAt: '2026-10-05T13:00:00Z',
      saleCount: 2,
      totalAmount: 20000,
      cashAmount: 10000,
      cardAmount: 10000,
      vatAmount: 2000,
      soldItems: { from: 'a', to: 'b', items },
    };

    const order = [];
    printReportEscpos.mockImplementation(async () => {
      order.push('z');
      return { ok: true };
    });
    printShiftItemsReceipt.mockImplementation(async () => {
      order.push('items');
      return { mode: 'silent' };
    });

    const res = await printCloseShiftReports(closed, { t: (k) => k });

    expect(order).toEqual(['z', 'items']);
    expect(res.zPrinted).toBe(true);
    expect(res.items).toEqual({ printed: true, mode: 'silent' });
    expect(printReportEscpos.mock.calls[0][0].shiftReport.reportType).toBe('Z');
  });

  it('still prints sold items when ESC/POS reports are unavailable', async () => {
    isCashierEscposReportPrintAvailable.mockReturnValue(false);
    const res = await printCloseShiftReports({
      soldItems: { from: 'a', to: 'b', items },
      saleCount: 1,
    }, { t: (k) => k });

    expect(res.zPrinted).toBe(false);
    expect(printReportEscpos).not.toHaveBeenCalled();
    expect(res.items.printed).toBe(true);
  });
});
