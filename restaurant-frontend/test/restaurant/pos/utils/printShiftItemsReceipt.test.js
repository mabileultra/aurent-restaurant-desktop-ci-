import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const printer = vi.hoisted(() => ({
  isDesktopPrinter: vi.fn(),
  getDesktopPrinterSettings: vi.fn(),
  printTicketLines: vi.fn(),
}));
const browser = vi.hoisted(() => ({ printViaIframe: vi.fn() }));

vi.mock('../../../../src/restaurant/pos/utils/desktopPrinters', () => printer);
vi.mock('../../../../src/restaurant/pos/utils/printOrdinarySaleReceipt', () => ({
  printViaIframe: browser.printViaIframe,
  escapeHtml: (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;'),
}));

const {
  groupShiftItemsByCategory,
  printShiftItemsReceipt,
} = await import('../../../../src/restaurant/pos/utils/printShiftItemsReceipt');

const t = (key, opts = {}) => {
  if (key === 'rst.shift.itemsQty') return `${opts.count} шт.`;
  if (key === 'rst.shift.itemsUncategorized') return 'Без категории';
  return opts.defaultValue ?? key;
};

const report = {
  storeName: 'Rayhon',
  cashierName: 'Dilnoza',
  openedAt: '2026-10-01T03:00:00Z',
  reportAt: '2026-10-01T22:00:00Z',
  items: [
    { categoryName: 'Горячее', name: 'Лагман', quantity: 12, amount: 360000 },
    { categoryName: 'Напитки', name: 'Чай', quantity: 30, amount: 90000 },
  ],
};

beforeEach(() => {
  globalThis.window = {};
  printer.isDesktopPrinter.mockReset();
  printer.getDesktopPrinterSettings.mockReset();
  printer.printTicketLines.mockReset().mockResolvedValue(undefined);
  browser.printViaIframe.mockReset().mockResolvedValue('dialog');
});

afterEach(() => {
  delete globalThis.window;
});

const compact = (s) => s.replace(/\s/g, '');

describe('groupShiftItemsByCategory', () => {
  it('keeps API order and buckets empty category as uncategorized', () => {
    const groups = groupShiftItemsByCategory([
      { categoryName: 'Горячее', name: 'Лагман', quantity: 2, amount: 100 },
      { categoryName: '', name: 'Самса', quantity: 1, amount: 50 },
      { categoryName: 'Горячее', name: 'Плов', quantity: 3, amount: 200 },
    ], 'Без категории');

    expect(groups.map((g) => g.label)).toEqual(['Горячее', 'Без категории']);
    expect(groups[0].quantity).toBe(5);
    expect(groups[0].amount).toBe(300);
    expect(groups[1].items).toHaveLength(1);
  });
});

describe('printShiftItemsReceipt', () => {
  it('skips without a report', async () => {
    expect(await printShiftItemsReceipt({ report: null, t })).toEqual({ mode: 'skip' });
    expect(printer.printTicketLines).not.toHaveBeenCalled();
    expect(browser.printViaIframe).not.toHaveBeenCalled();
  });

  it('prints sold dishes grouped by category with subtotals', async () => {
    printer.isDesktopPrinter.mockReturnValue(true);
    printer.getDesktopPrinterSettings.mockResolvedValue({ receiptPrinterName: 'XP-80' });

    const res = await printShiftItemsReceipt({ report, t });

    expect(res).toEqual({ mode: 'silent' });
    expect(browser.printViaIframe).not.toHaveBeenCalled();
    const { title, lines, printerName } = printer.printTicketLines.mock.calls[0][0];
    expect(printerName).toBe('XP-80');
    expect(title).toBe('Продано за смену');
    expect(lines[0]).toBe('ПРОДАНО ЗА СМЕНУ');
    expect(lines).toContain('Rayhon');
    expect(lines).toContain('Dilnoza');
    expect(lines).toContain('≫ Горячее');
    expect(lines).toContain('≫ Напитки');

    const lagman = lines.find((l) => l.startsWith('12 x Лагман'));
    const tea = lines.find((l) => l.startsWith('30 x Чай'));
    expect(compact(lagman)).toContain('360000');
    expect(compact(tea)).toContain('90000');
    expect(lagman.length).toBeLessThanOrEqual(32);

    const hotSub = lines.find((l) => l.startsWith('Горячее'));
    expect(hotSub).toContain('12 шт.');
    const drinksSub = lines.find((l) => l.startsWith('Напитки'));
    expect(drinksSub).toContain('30 шт.');

    const totalRow = lines.find((l) => l.startsWith('ИТОГО'));
    expect(totalRow).toContain('42 шт.');
    expect(compact(lines[lines.length - 1])).toContain('450000');
  });

  it('falls back to the browser when the desktop has no receipt printer', async () => {
    printer.isDesktopPrinter.mockReturnValue(true);
    printer.getDesktopPrinterSettings.mockResolvedValue({ receiptPrinterName: '' });

    const res = await printShiftItemsReceipt({ report, t });

    expect(res).toEqual({ mode: 'dialog' });
    expect(printer.printTicketLines).not.toHaveBeenCalled();
    expect(browser.printViaIframe).toHaveBeenCalledTimes(1);
  });

  it('browser slip lists category blocks, totals and escapes names', async () => {
    printer.isDesktopPrinter.mockReturnValue(false);

    await printShiftItemsReceipt({
      report: {
        ...report,
        items: [...report.items, { categoryName: 'Горячее', name: '<b>Самса</b>', quantity: 2, amount: 16000 }],
      },
      t,
    });

    const html = browser.printViaIframe.mock.calls[0][0];
    expect(html).toContain('Продано за смену');
    expect(html).toContain('≫ Горячее');
    expect(html).toContain('≫ Напитки');
    expect(html).toContain('12 × Лагман');
    expect(html).toContain('30 × Чай');
    expect(html).toContain('&lt;b&gt;Самса&lt;/b&gt;');
    expect(html).not.toContain('<b>Самса</b>');
    expect(html).toContain('44 шт.');
    expect(compact(html)).toContain('466000');
  });

  it('prints an empty-shift slip instead of failing', async () => {
    printer.isDesktopPrinter.mockReturnValue(true);
    printer.getDesktopPrinterSettings.mockResolvedValue({ receiptPrinterName: 'XP-80' });

    await printShiftItemsReceipt({ report: { ...report, items: [] }, t });

    const { lines } = printer.printTicketLines.mock.calls[0][0];
    expect(lines).toContain('Продаж нет');
    expect(lines.find((l) => l.startsWith('ИТОГО'))).toContain('0 шт.');
  });

  it('uses store and cashier passed by the modal when the Z report has none', async () => {
    printer.isDesktopPrinter.mockReturnValue(true);
    printer.getDesktopPrinterSettings.mockResolvedValue({ receiptPrinterName: 'XP-80' });

    await printShiftItemsReceipt({
      report: { ...report, storeName: null, cashierName: null },
      storeName: 'Filial 2',
      cashierName: 'Timur',
      t,
    });

    const { lines } = printer.printTicketLines.mock.calls[0][0];
    expect(lines).toContain('Filial 2');
    expect(lines).toContain('Timur');
  });

  it('treats missing categoryName as uncategorized and still prints totals', async () => {
    printer.isDesktopPrinter.mockReturnValue(true);
    printer.getDesktopPrinterSettings.mockResolvedValue({ receiptPrinterName: 'XP-80' });

    await printShiftItemsReceipt({
      report: {
        ...report,
        items: [
          { name: 'Лагман', quantity: 2, amount: 60000 },
          { categoryName: 'Напитки', name: 'Чай', quantity: 1, amount: 3000 },
        ],
      },
      t,
    });

    const { lines } = printer.printTicketLines.mock.calls[0][0];
    expect(lines).toContain('≫ Без категории');
    expect(lines).toContain('≫ Напитки');
    expect(lines.find((l) => l.startsWith('ИТОГО'))).toContain('3 шт.');
    expect(compact(lines[lines.length - 1])).toContain('63000');
  });
});
