import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildQrPayload } from '../../../src/utils/fiscalReceiptFormat';
import { isOfdCheckUrl } from '../../../src/utils/ofdQrUrl';

vi.mock('../../../src/store/tenantDisplayStore', () => ({
  useTenantDisplayStore: {
    getState: () => ({
      committed: {
        receiptFields: { qrCode: true, fiscalBlock: true, footer: true },
        receiptCompanyName: 'Test Co',
        receiptCompanyAddress: 'Addr',
        receiptCompanyPhone: '',
        receiptStir: '',
        receiptLogoDataUrl: null,
      },
    }),
  },
}));

vi.mock('../../../src/store/printSettingsStore', () => ({
  usePrintSettingsStore: {
    getState: () => ({ paperWidthMm: 80 }),
  },
}));

import { buildCashierEscposPayload } from '../../../src/services/cashierEscpos/buildCashierEscposPayload';

const t = (key) => key;

const FISCAL_SALE = {
  id: 'sale-1',
  receiptNumber: 'RCP-20260907-0010',
  cashierName: 'Cashier',
  createdAt: '2026-09-07T05:26:36',
  totalAmount: 1000,
  taxTotal: 107.14,
  paymentMethod: 'CASH',
  amountTendered: 1000,
  changeGiven: 0,
  fiscalSign: 'SIGN99',
  fiscalReceiptSeq: '42',
  fiscalTerminalId: 'TERM1',
  fiscalizedAt: '2026-09-07T05:26:36',
  fiscalQrUrl: 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99',
  printFiscalQr: true,
  items: [{ productName: 'Item', quantity: 1, lineTotal: 1000 }],
};

describe('buildCashierEscposPayload QR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('puts ofd QR into qrValue when Multikassa fiscal fields present', () => {
    const payload = buildCashierEscposPayload(FISCAL_SALE, t);
    expect(payload.qrValue).toBe(FISCAL_SALE.fiscalQrUrl);
    expect(isOfdCheckUrl(payload.qrValue)).toBe(true);
    expect(payload.receiptFields.qrCode).toBe(true);
    expect(payload.receiptFields.footer).toBe(false);
    expect(payload.labels.footer).toBe('');
    expect(payload.sale.printFiscalQr).toBe(true);
    expect(payload.branding.fmNumber).toBe('TERM1');
    expect(payload.paperWmm).toBe(80);
  });

  it('rebuilds QR from sign+seq+terminal when fiscalQrUrl missing', () => {
    const sale = { ...FISCAL_SALE, fiscalQrUrl: null };
    const payload = buildCashierEscposPayload(sale, t);
    expect(isOfdCheckUrl(payload.qrValue)).toBe(true);
    expect(payload.qrValue).toContain('t=TERM1');
    expect(payload.qrValue).toContain('s=SIGN99');
    expect(buildQrPayload(sale)).toBe(payload.qrValue);
  });

  it('clears qrValue when printFiscalQr=false (desktop toggle off)', () => {
    const payload = buildCashierEscposPayload({ ...FISCAL_SALE, printFiscalQr: false }, t);
    expect(payload.qrValue).toBe('');
    expect(payload.receiptFields.qrCode).toBe(false);
    expect(payload.sale.printFiscalQr).toBe(false);
  });

  it('leaves qrValue empty when sale has no fiscal proof (offline / pending)', () => {
    const payload = buildCashierEscposPayload(
      {
        ...FISCAL_SALE,
        fiscalSign: null,
        fiscalReceiptSeq: null,
        fiscalTerminalId: null,
        fiscalQrUrl: null,
        fiscalizedAt: null,
      },
      t,
    );
    expect(payload.qrValue).toBe('');
  });
});

describe('buildCashierEscposPayload shift label', () => {
  it('uses shiftOpenedAt / register number, not receipt tail or fixed 001', () => {
    const withOpened = buildCashierEscposPayload(
      {
        ...FISCAL_SALE,
        receiptNumber: 'PHR-20260918-0007',
        shiftOpenedAt: '2026-09-18T09:05:00+05:00',
      },
      t,
    );
    expect(withOpened.branding.shiftNo).toMatch(/18\.09\.2026/);
    expect(withOpened.branding.shiftNo).not.toBe('007');
    expect(withOpened.branding.shiftNo).not.toBe('001');

    const withRegister = buildCashierEscposPayload(
      {
        ...FISCAL_SALE,
        shiftRegisterNumber: 2,
        shiftOpenedAt: '2026-09-18T09:05:00+05:00',
      },
      t,
    );
    expect(withRegister.branding.shiftNo).toBe('2');
  });
});
