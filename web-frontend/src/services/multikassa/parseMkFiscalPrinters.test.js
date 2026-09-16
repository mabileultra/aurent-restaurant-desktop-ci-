import { describe, it, expect } from 'vitest';
import { parseMkFiscalPrinters, pickMkFiscalPrinterToSelect } from './parseMkFiscalPrinters';

const MK_FISCAL_1_2 = {
  success: true,
  message: 'Операция выполнена успешно',
  data: {
    result: {
      printers: [
        { PrinterName: '(не печатать)', IsOnline: false, HasPaper: false, IsCoverOpen: false },
        { PrinterName: 'XP-80C', IsOnline: true, HasPaper: true, IsCoverOpen: false },
        { PrinterName: 'Microsoft Print to PDF', IsOnline: true, HasPaper: true, IsCoverOpen: false },
      ],
      paperWidths: [58, 70, 80],
      selectedPrinter: 'XP-80C',
      selectedPaperWidth: 80,
    },
  },
};

describe('parseMkFiscalPrinters', () => {
  it('reads MK Fiscal 1.2 envelope with PrinterName', () => {
    const parsed = parseMkFiscalPrinters(MK_FISCAL_1_2);
    expect(parsed.labels).toContain('XP-80C');
    expect(parsed.labels).toContain('Microsoft Print to PDF');
    expect(parsed.selected).toBe('XP-80C');
    expect(parsed.selectedValid).toBe(true);
    expect(parsed.paperWidth).toBe(80);
  });

  it('treats empty and «не печатать» as missing selection', () => {
    const empty = parseMkFiscalPrinters({
      data: { result: { printers: MK_FISCAL_1_2.data.result.printers, selectedPrinter: '' } },
    });
    expect(empty.selectedValid).toBe(false);
    expect(pickMkFiscalPrinterToSelect(empty)).toBe('XP-80C');

    const dummy = parseMkFiscalPrinters({
      data: {
        result: { printers: MK_FISCAL_1_2.data.result.printers, selectedPrinter: '(не печатать)' },
      },
    });
    expect(dummy.selectedValid).toBe(false);
    expect(pickMkFiscalPrinterToSelect(dummy)).toBe('XP-80C');
  });

  it('does not treat paperWidths as printers', () => {
    const parsed = parseMkFiscalPrinters(MK_FISCAL_1_2);
    expect(parsed.labels).not.toContain('58');
  });
});
