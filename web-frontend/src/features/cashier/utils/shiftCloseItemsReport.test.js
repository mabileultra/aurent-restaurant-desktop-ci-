import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./printShiftItemsReceipt', () => ({
  printShiftItemsReceipt: vi.fn(),
}));

const { printShiftItemsReceipt } = await import('./printShiftItemsReceipt');
const { printSoldItemsOnShiftClose, shiftCloseItemsReport } = await import('./shiftCloseItemsReport');

const items = [{ name: 'Молоко', quantity: 2, amount: 14000 }];

beforeEach(() => {
  printShiftItemsReceipt.mockReset();
  printShiftItemsReceipt.mockResolvedValue({ mode: 'silent' });
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
