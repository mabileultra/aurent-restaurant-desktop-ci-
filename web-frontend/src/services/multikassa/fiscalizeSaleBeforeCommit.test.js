import { describe, it, expect, vi, beforeEach } from 'vitest';

const runMultikassaOperation = vi.fn();

vi.mock('./runMultikassaOperation', () => ({
  runMultikassaOperation: (...args) => runMultikassaOperation(...args),
}));

vi.mock('./resolveFiscalPackageCodes', () => ({
  enrichFiscalPackageCodes: async (items) => items,
  isRealFiscalPackageCode: (value) => {
    const code = String(value || '').trim();
    return /^\d{3,}$/.test(code) && code !== '1';
  },
}));

vi.mock('./buildMultikassaOperations', () => ({
  buildSaleOperationBody: () => ({
    receipt_gnk_terminalid: 'TERM1',
    receipt_gnk_time: '20260907122636',
  }),
  normalizeGnkTerminalId: (value) => String(value || '').trim(),
}));

import { FISCAL_STATUS } from './multikassaConstants';
import { fiscalizeSaleBeforeCommit } from './fiscalizeSaleBeforeCommit';
import { isOfdCheckUrl } from '../../utils/ofdQrUrl';

const BASE_CAPS = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:8080',
  terminalId: 'TERM1',
  requireBeforeSale: false,
  printFiscalQr: true,
};

const CART = [
  {
    productName: 'Test',
    quantity: 1,
    unitPrice: 1000,
    lineTotal: 1000,
    ikpu: '12345678901234567',
    packageCode: '1546940',
    taxRatePercent: 12,
  },
];

describe('fiscalizeSaleBeforeCommit → QR from Multikassa', () => {
  beforeEach(() => {
    runMultikassaOperation.mockReset();
  });

  it('returns ofd.soliq.uz QR when module returns real fiscal proof + QRCodeURL', async () => {
    const qr =
      'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99';
    runMultikassaOperation.mockResolvedValue({
      fiscalStatus: FISCAL_STATUS.FISCALIZED,
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      multikassaSaleId: 'sale-guid-001',
      fiscalQrUrl: qr,
      terminalId: 'TERM1',
      datetime: '20260907122636',
      fiscalError: null,
    });

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: BASE_CAPS,
      cartItems: CART,
      payment: { paymentMethod: 'CASH', amountTendered: 1000 },
      total: 1000,
      shiftId: 10,
      cashierName: 'Cashier',
    });

    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(payload.fiscalSign).toBe('SIGN99');
    expect(payload.fiscalReceiptSeq).toBe('42');
    expect(payload.fiscalQrUrl).toBe(qr);
    expect(isOfdCheckUrl(payload.fiscalQrUrl)).toBe(true);
    expect(payload.fiscalTerminalId).toBe('TERM1');
  });

  it('builds OFD QR via ensureFiscalQrUrl when module omits QRCodeURL but has sign+seq+terminal', async () => {
    runMultikassaOperation.mockResolvedValue({
      fiscalStatus: FISCAL_STATUS.FISCALIZED,
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      multikassaSaleId: 'sale-guid-002',
      fiscalQrUrl: null,
      terminalId: 'TERM1',
      datetime: '20260907122636',
      fiscalError: null,
    });

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: BASE_CAPS,
      cartItems: CART,
      payment: { paymentMethod: 'CASH', amountTendered: 1000 },
      total: 1000,
      shiftId: 10,
      cashierName: 'Cashier',
    });

    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(isOfdCheckUrl(payload.fiscalQrUrl)).toBe(true);
    expect(payload.fiscalQrUrl).toContain('t=TERM1');
    expect(payload.fiscalQrUrl).toContain('s=SIGN99');
  });

  it('soft-fails without QR when Multikassa unreachable and requireBeforeSale=false', async () => {
    runMultikassaOperation.mockRejectedValue(new Error('ECONNREFUSED'));

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: { ...BASE_CAPS, requireBeforeSale: false },
      cartItems: CART,
      payment: { paymentMethod: 'CASH', amountTendered: 1000 },
      total: 1000,
      shiftId: 10,
      cashierName: 'Cashier',
      offline: true,
    });

    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.PENDING);
    expect(payload.fiscalQrUrl).toBeNull();
    expect(payload.fiscalSign).toBeNull();
  });

  it('blocks sale when requireBeforeSale=true and Multikassa returns no fiscal proof', async () => {
    runMultikassaOperation.mockResolvedValue({
      fiscalStatus: FISCAL_STATUS.FAILED,
      fiscalSign: null,
      fiscalReceiptSeq: null,
      multikassaSaleId: null,
      fiscalQrUrl: null,
      fiscalError: 'module offline',
    });

    await expect(
      fiscalizeSaleBeforeCommit({
        capabilities: { ...BASE_CAPS, requireBeforeSale: true },
        cartItems: CART,
        payment: { paymentMethod: 'CASH', amountTendered: 1000 },
        total: 1000,
        shiftId: 10,
        cashierName: 'Cashier',
      }),
    ).rejects.toMatchObject({ code: 'MULTIKASSA_FISCAL_FAILED' });
  });

  it('returns null when Multikassa disabled — no fiscal QR expected', async () => {
    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: { enabled: false, printFiscalQr: true },
      cartItems: CART,
      payment: { paymentMethod: 'CASH', amountTendered: 1000 },
      total: 1000,
    });
    expect(payload).toBeNull();
    expect(runMultikassaOperation).not.toHaveBeenCalled();
  });
});
