import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShiftItemsReceiptLines, printShiftItemsReceipt } from './printShiftItemsReceipt';

const t = (key, opts = {}) => {
  if (key === 'pos.shiftItemsQty') return `${opts.count} шт.`;
  if (key === 'pos.shiftItemsTitle') return 'Продано за смену';
  if (key === 'pos.shiftItemsTotal') return 'ИТОГО';
  if (key === 'pos.shiftItemsEmpty') return 'Продаж нет';
  return key;
};

const report = {
  storeName: 'Аптека 1',
  cashierName: 'Азиза',
  openedAt: '2026-10-01T04:00:00Z',
  reportAt: '2026-10-01T13:00:00Z',
  items: [
    { name: 'Парацетамол', quantity: '2.000', amount: 18000 },
    { name: 'Молоко', quantity: 1.5, amount: 22500 },
  ],
};

const compact = (s) => String(s ?? '').replace(/\s/g, '');

let writtenHtml = '';

beforeEach(() => {
  writtenHtml = '';
  globalThis.window = {
    setTimeout: (fn) => {
      fn();
      return 0;
    },
  };
  globalThis.document = {
    documentElement: { lang: 'ru' },
    body: { appendChild() {} },
    createElement() {
      return {
        style: {},
        setAttribute() {},
        remove() {},
        contentWindow: {
          focus() {},
          print() {},
          document: {
            readyState: 'complete',
            open() {},
            write(html) { writtenHtml = html; },
            close() {},
          },
        },
      };
    },
  };
});

afterEach(() => {
  delete globalThis.window;
  delete globalThis.document;
});

describe('buildShiftItemsReceiptLines', () => {
  it('lists every sold product with qty and amount', () => {
    const { lines } = buildShiftItemsReceiptLines({ report, t });
    const text = lines.join('\n');
    expect(text).toContain('ПРОДАНО ЗА СМЕНУ');
    expect(text).toContain('Аптека 1');
    expect(text).toContain('Азиза');
    expect(text).toContain('2 x Парацетамол');
    expect(text).toContain('1.5 x Молоко');
    expect(lines.find((line) => line.startsWith('ИТОГО'))).toContain('3.5 шт.');
    expect(compact(lines.at(-1))).toContain('40500');
    expect(lines.find((line) => line.includes('Парацетамол')).length).toBeLessThanOrEqual(32);
  });

  it('clips a long name so the amount stays on the slip', () => {
    const { lines } = buildShiftItemsReceiptLines({
      report: {
        ...report,
        items: [{ name: 'Очень длинное название товара которое не влезает', quantity: 1, amount: 1000 }],
      },
      t,
    });
    const row = lines.find((line) => line.includes('…'));
    expect(row.length).toBeLessThanOrEqual(32);
    expect(compact(row)).toContain('1000');
  });

  it('prints an empty slip when the shift had no sales', () => {
    const { lines } = buildShiftItemsReceiptLines({
      report: { items: [], openedAt: null, reportAt: null },
      t,
    });
    expect(lines.join('\n')).toContain('Продаж нет');
    expect(lines.find((line) => line.startsWith('ИТОГО'))).toContain('0 шт.');
  });
});

describe('printShiftItemsReceipt', () => {
  it('skips without a report', async () => {
    expect(await printShiftItemsReceipt({ report: null, t })).toEqual({ mode: 'skip' });
  });

  it('prints on the desktop receipt printer and picks 58mm paper', async () => {
    const printPlainEscpos = vi.fn().mockResolvedValue(undefined);
    window.desktopCashier = {
      isDesktop: true,
      getPrinterSettings: async () => ({ receiptPrinterName: 'XP-58' }),
      printPlainEscpos,
    };

    const res = await printShiftItemsReceipt({ report, t });

    expect(res).toEqual({ mode: 'silent' });
    expect(writtenHtml).toBe('');
    const payload = printPlainEscpos.mock.calls[0][0];
    expect(payload.printerName).toBe('XP-58');
    expect(payload.paperWmm).toBe(58);
    expect(payload.title).toBe('Продано за смену');
    expect(payload.lines.some((line) => line.startsWith('2 x Парацетамол'))).toBe(true);
    expect(payload.lines.find((line) => line.startsWith('ИТОГО'))).toContain('3.5 шт.');
  });

  it('uses html ticket when escpos is missing', async () => {
    const printTicketHtml = vi.fn().mockResolvedValue(undefined);
    window.desktopCashier = {
      isDesktop: true,
      getPrinterSettings: async () => ({ receiptPrinterName: 'XP-80' }),
      printTicketHtml,
    };

    const res = await printShiftItemsReceipt({ report, t });

    expect(res).toEqual({ mode: 'silent' });
    expect(printTicketHtml.mock.calls[0][0].printerName).toBe('XP-80');
    expect(printTicketHtml.mock.calls[0][0].html).toContain('Парацетамол');
  });

  it('falls back to the browser and escapes names', async () => {
    window.desktopCashier = {
      isDesktop: true,
      getPrinterSettings: async () => ({ receiptPrinterName: '' }),
    };

    const res = await printShiftItemsReceipt({
      report: {
        ...report,
        items: [...report.items, { name: '<b>Самса</b>', quantity: 1, amount: 4000 }],
      },
      storeName: 'Запас',
      cashierName: 'Запасной',
      t,
    });

    expect(res).toEqual({ mode: 'dialog' });
    expect(writtenHtml).toContain('Продано за смену');
    expect(writtenHtml).toContain('2 × Парацетамол');
    expect(writtenHtml).toContain('&lt;b&gt;Самса&lt;/b&gt;');
    expect(writtenHtml).not.toContain('<b>Самса</b>');
    expect(writtenHtml).toContain('4.5 шт.');
    expect(compact(writtenHtml)).toContain('44500');
  });

  it('uses store and cashier from the modal when the close payload has none', async () => {
    const printPlainEscpos = vi.fn().mockResolvedValue(undefined);
    window.desktopCashier = {
      isDesktop: true,
      getPrinterSettings: async () => ({ receiptPrinterName: 'XP-80' }),
      printPlainEscpos,
    };

    await printShiftItemsReceipt({
      report: { ...report, storeName: null, cashierName: '' },
      storeName: 'Филиал 2',
      cashierName: 'Тимур',
      t,
    });

    const lines = printPlainEscpos.mock.calls[0][0].lines;
    expect(lines).toContain('Филиал 2');
    expect(lines).toContain('Тимур');
  });

  it('lets a printer failure surface so the shift modal can toast it', async () => {
    window.desktopCashier = {
      isDesktop: true,
      getPrinterSettings: async () => ({ receiptPrinterName: 'XP-80' }),
      printPlainEscpos: async () => {
        throw new Error('принтер занят');
      },
    };

    await expect(printShiftItemsReceipt({ report, t })).rejects.toThrow('принтер занят');
  });
});
