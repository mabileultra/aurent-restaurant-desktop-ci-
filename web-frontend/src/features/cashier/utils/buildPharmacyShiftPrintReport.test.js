import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPharmacyShiftPrintReport } from './buildPharmacyShiftPrintReport';

describe('buildPharmacyShiftPrintReport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T12:00:00.000Z'));
  });

  it('maps shift totals with reportType X', () => {
    const report = buildPharmacyShiftPrintReport({
      id: 's1',
      storeId: 30,
      storeName: 'Аптека',
      cashierName: 'Азиза',
      openedAt: '2026-10-05T05:00:00Z',
      saleCount: 3,
      totalAmount: 100,
      cashAmount: 40,
      cardAmount: 60,
      vatAmount: 12,
    }, { reportType: 'X' });

    expect(report.reportType).toBe('X');
    expect(report.kind).toBeUndefined();
    expect(report).toMatchObject({
      shiftId: 's1',
      storeId: 30,
      storeName: 'Аптека',
      saleCount: 3,
      totalAmount: 100,
      cashAmount: 40,
      cardAmount: 60,
      reportAt: '2026-10-05T12:00:00.000Z',
    });
  });

  it('uses closedAt as Z reportAt and modal name fallbacks', () => {
    const report = buildPharmacyShiftPrintReport({
      id: 's2',
      closedAt: '2026-10-05T11:00:00Z',
      saleCount: 1,
      totalAmount: 50,
    }, {
      reportType: 'Z',
      storeName: 'Филиал',
      cashierName: 'Тимур',
    });

    expect(report).toMatchObject({
      reportType: 'Z',
      storeName: 'Филиал',
      cashierName: 'Тимур',
      reportAt: '2026-10-05T11:00:00Z',
    });
  });

  it('rejects missing shift or invalid reportType', () => {
    expect(buildPharmacyShiftPrintReport(null, { reportType: 'Z' })).toBeNull();
    expect(buildPharmacyShiftPrintReport({ id: 1 }, { reportType: 'kind' })).toBeNull();
  });
});
