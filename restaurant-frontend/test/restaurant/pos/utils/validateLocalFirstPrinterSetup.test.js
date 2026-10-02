/**
 * Unit tests for local-first printer startup validation (no Electron).
 */
import { describe, it, expect } from 'vitest';
import { validateLocalFirstPrinterSetup } from '../../../../src/restaurant/pos/utils/validateLocalFirstPrinterSetup.js';

describe('validateLocalFirstPrinterSetup', () => {
  it('flags missing station printers', () => {
    const res = validateLocalFirstPrinterSetup({
      stations: [{ id: 'k1', name: 'Kitchen' }, { id: 'b1', name: 'Bar' }],
      stationPrinters: { k1: 'Kitchen-1' },
      osPrinterNames: ['Kitchen-1', 'Bar-1'],
    });
    expect(res.ok).toBe(false);
    expect(res.canOperate).toBe(true);
    expect(res.missingStations.map((r) => r.stationId)).toEqual(['b1']);
  });

  it('ok when all stations mapped and present on device', () => {
    const res = validateLocalFirstPrinterSetup({
      stations: [{ id: 'k1', name: 'Kitchen' }],
      stationPrinters: { k1: 'Kitchen-1' },
      billPrinterName: 'Cashier-1',
      osPrinterNames: ['Kitchen-1', 'Cashier-1'],
    });
    expect(res.ok).toBe(true);
    expect(res.canOperate).toBe(true);
    expect(res.bill.ok).toBe(true);
  });

  it('cannot operate when no kitchen printers at all', () => {
    const res = validateLocalFirstPrinterSetup({
      stations: [{ id: 'k1', name: 'Kitchen' }],
      stationPrinters: {},
      osPrinterNames: ['X'],
    });
    expect(res.canOperate).toBe(false);
    expect(res.ok).toBe(false);
  });
});
