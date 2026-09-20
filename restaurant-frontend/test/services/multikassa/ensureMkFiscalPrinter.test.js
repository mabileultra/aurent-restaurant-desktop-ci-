import { describe, it, expect, vi } from 'vitest';
import { ensureMkFiscalPrinter } from '../../../src/services/multikassa/ensureMkFiscalPrinter';

const PRINTERS = [
  { PrinterName: '(не печатать)', IsOnline: false },
  { PrinterName: 'XP-80C', IsOnline: true },
];

describe('ensureMkFiscalPrinter', () => {
  it('switches XP-80C to silent «не печатать» so MK Fiscal does not print', async () => {
    const getPrintersWithFallback = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { result: { printers: PRINTERS, selectedPrinter: 'XP-80C', selectedPaperWidth: 80 } },
      },
    });
    const selectPrinter = vi.fn().mockResolvedValue({});
    const result = await ensureMkFiscalPrinter('http://127.0.0.1:12346', {
      getPrintersWithFallback,
      selectPrinter,
    });
    expect(result.selected).toBe('(не печатать)');
    expect(result.silent).toBe(true);
    expect(result.changed).toBe(true);
    expect(selectPrinter).toHaveBeenCalledWith(
      'http://127.0.0.1:12346',
      expect.objectContaining({ PrinterName: '(не печатать)', selectedPrinter: '(не печатать)' }),
    );
  });

  it('does not re-select when silent printer is already chosen', async () => {
    const getPrintersWithFallback = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          result: { printers: PRINTERS, selectedPrinter: '(не печатать)', selectedPaperWidth: 80 },
        },
      },
    });
    const selectPrinter = vi.fn();
    const result = await ensureMkFiscalPrinter('http://127.0.0.1:12346', {
      getPrintersWithFallback,
      selectPrinter,
    });
    expect(result.selected).toBe('(не печатать)');
    expect(result.silent).toBe(true);
    expect(result.changed).toBe(false);
    expect(selectPrinter).not.toHaveBeenCalled();
  });
});
