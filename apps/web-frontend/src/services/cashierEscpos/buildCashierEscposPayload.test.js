import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildQrPayload } from '../../utils/fiscalReceiptFormat';
import { isOfdCheckUrl } from '../../utils/ofdQrUrl';

vi.mock('../../store/tenantDisplayStore', () => ({
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

vi.mock('../../store/printSettingsStore', () => ({
  usePrintSettingsStore: {
    getState: () => ({ paperWidthMm: 80 }),
  },
}));

import { buildCashierEscposPayload, buildEscposLabels } from './buildCashierEscposPayload';

/** Mimic i18next: substitute {{key}} from opts. */
const t = (key, opts = {}) => {
  const templates = {
    'fiscalReceipt.vatLineShort': 'НДС {{rate}}%',
    'fiscalReceipt.vatTotalLine': 'НДС {{rate}}%',
  };
  let s = templates[key] || key;
  for (const [k, v] of Object.entries(opts)) {
    s = s.replaceAll(`{{${k}}}`, String(v));
  }
  return s;
};

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
    expect(payload.receiptFields.footer).toBe(true);
    expect(payload.labels.footer).toBe('fiscalReceipt.footer');
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

describe('buildCashierEscposPayload plastic label', () => {
  it('appends card type to plastic payment row', () => {
    const plain = buildCashierEscposPayload(FISCAL_SALE, t);
    expect(plain.labels.plastic).toBe('fiscalReceipt.plastic');

    const corporate = buildCashierEscposPayload({ ...FISCAL_SALE, cardType: 'CORPORATE' }, t);
    expect(corporate.labels.plastic).toBe('fiscalReceipt.plastic · pos.cardCorporate');
  });
});

describe('buildEscposLabels VAT rate', () => {
  it('keeps {{rate}} placeholder for electron per-line interpolation', () => {
    const labels = buildEscposLabels(t);
    expect(labels.vatLineShort).toBe('НДС {{rate}}%');
    expect(labels.vatTotalLine).toBe('НДС {{rate}}%');
    expect(labels.vatLineShort).not.toContain('12');
  });
});
