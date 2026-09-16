import { describe, it, expect, vi } from 'vitest';
import { ensureMkFiscalPrinter } from './ensureMkFiscalPrinter';

const PRINTERS = [
  { PrinterName: '(не печатать)', IsOnline: false },
  { PrinterName: 'XP-80C', IsOnline: true },
];

describe('ensureMkFiscalPrinter', () => {
  it('does not re-select when XP-80C is already selected', async () => {
    const getPrintersWithFallback = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { result: { printers: PRINTERS, selectedPrinter: 'XP-80C', selectedPaperWidth: 80 } },
      },
    });
    const selectPrinter = vi.fn();
    const result = await ensureMkFiscalPrinter('http://127.0.0.1:12346', {
      getPrintersWithFallback,
      selectPrinter,
    });
    expect(result.selected).toBe('XP-80C');
    expect(result.changed).toBe(false);
    expect(selectPrinter).not.toHaveBeenCalled();
  });

  it('selects XP-80C when MK Fiscal has dummy «не печатать»', async () => {
    const getPrintersWithFallback = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { result: { printers: PRINTERS, selectedPrinter: '(не печатать)', selectedPaperWidth: 80 } },
      },
    });
    const selectPrinter = vi.fn().mockResolvedValue({});
    const result = await ensureMkFiscalPrinter('http://127.0.0.1:12346', {
      getPrintersWithFallback,
      selectPrinter,
    });
    expect(result.selected).toBe('XP-80C');
    expect(result.changed).toBe(true);
    expect(selectPrinter).toHaveBeenCalledWith(
      'http://127.0.0.1:12346',
      expect.objectContaining({ PrinterName: 'XP-80C', selectedPrinter: 'XP-80C' }),
    );
  });
});
