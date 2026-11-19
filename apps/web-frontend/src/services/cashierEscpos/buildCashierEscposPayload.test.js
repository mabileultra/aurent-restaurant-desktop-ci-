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
    'receipt.committentTin': 'Komitent (STIR)',
    'receipt.committentPinfl': 'Komitent (JShShIR)',
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
    expect(payload.labels.footer).toBe('Xaridingiz uchun rahmat. Chekni saqlang.');
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
  it('appends provider to plastic payment row and exports separate card category, social card, and RRN in Uzbek', () => {
    const plain = buildCashierEscposPayload(FISCAL_SALE, t);
    expect(plain.labels.plastic).toBe('Bank kartasi');

    const humo = buildCashierEscposPayload(
      { ...FISCAL_SALE, paymentMethod: 'CARD', cardType: 'HUMO' },
      t,
    );
    expect(humo.labels.plastic).toBe('Bank kartasi (Humo)');

    const social = buildCashierEscposPayload(
      {
        ...FISCAL_SALE,
        paymentMethod: 'CARD',
        cardType: 'HUMO',
        cardCategory: 'SOCIAL',
        socialCardNumber: '9860031122338031',
        rrn: '631810177451',
      },
      t,
    );
    expect(social.labels.plastic).toBe('Bank kartasi (Humo)');
    expect(social.labels.cardType).toBe('Bank kartasi turi');
    expect(social.labels.socialCardNumber).toBe('Ijtimoiy karta');
    expect(social.labels.cardRrn).toBe('RRN kodi');
    expect(social.sale.cardCategoryDisplay).toBe('Ijtimoiy');
    expect(social.sale.socialCardNumber).toBe('9860********8031');
    expect(social.sale.rrn).toBe('631810177451');

    const legacyCorporate = buildCashierEscposPayload(
      { ...FISCAL_SALE, paymentMethod: 'CARD', cardType: 'CORPORATE' },
      t,
    );
    expect(legacyCorporate.labels.plastic).toBe('Bank kartasi');
    expect(legacyCorporate.sale.cardCategoryDisplay).toBe('Korporativ');

    const plainCash = buildCashierEscposPayload(
      { ...FISCAL_SALE, paymentMethod: 'CASH', cardAmount: 0, cashAmount: 35000 },
      t,
    );
    expect(plainCash.sale.cardCategoryDisplay).toBeNull();
    expect(plainCash.sale.socialCardNumber).toBeNull();
    expect(plainCash.sale.rrn).toBeNull();
  });

  it('forces locale to uz and translates labels in Uzbek', () => {
    const payload = buildCashierEscposPayload(FISCAL_SALE, t);
    expect(payload.locale).toBe('uz');
    expect(payload.labels.cash).toBe('Naqd');
    expect(payload.labels.grandTotal).toBe('JAMI');
  });
});

describe('buildCashierEscposPayload: electronic prescription number', () => {
  it('passes the number and its label to the printer payload', () => {
    const payload = buildCashierEscposPayload({ ...FISCAL_SALE, prescriptionNumber: 'RX-2026-0042' }, t);
    expect(payload.sale.prescriptionNumber).toBe('RX-2026-0042');
    expect(payload.labels.prescriptionNumber).toBe('Elektron retsept');
  });

  it('prints no prescription row for a plain sale and ignores notes', () => {
    const payload = buildCashierEscposPayload({ ...FISCAL_SALE, notes: 'RX:RX-7777' }, t);
    expect(payload.sale.prescriptionNumber).toBeNull();
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

describe('buildCashierEscposPayload: QR code suppression for ADVANCE and CREDIT (AUR-4)', () => {
  it('suppresses QR for ADVANCE receipt', () => {
    const payload = buildCashierEscposPayload(
      { ...FISCAL_SALE, receiptType: 'ADVANCE' },
      t,
    );
    expect(payload.qrValue).toBe('');
    expect(payload.receiptFields.qrCode).toBe(false);
  });

  it('suppresses QR for CREDIT receipt', () => {
    const payload = buildCashierEscposPayload(
      { ...FISCAL_SALE, receiptType: 'CREDIT' },
      t,
    );
    expect(payload.qrValue).toBe('');
    expect(payload.receiptFields.qrCode).toBe(false);
  });

  it('preserves QR for standard SALE receipt', () => {
    const payload = buildCashierEscposPayload(
      { ...FISCAL_SALE, receiptType: 'SALE' },
      t,
    );
    expect(payload.qrValue).not.toBe('');
    expect(payload.receiptFields.qrCode).toBe(true);
  });

  it('preserves QR for RETURN receipt', () => {
    const payload = buildCashierEscposPayload(
      { ...FISCAL_SALE, receiptType: 'RETURN' },
      t,
    );
    expect(payload.qrValue).not.toBe('');
    expect(payload.receiptFields.qrCode).toBe(true);
  });
});

describe('buildEscposLabels committent (AUR-7)', () => {
  it('includes committent labels in Uzbek', () => {
    const labels = buildEscposLabels(t);
    expect(labels.committentTin).toBe('Komitent (STIR)');
    expect(labels.committentPinfl).toBe('Komitent (JShShIR)');
  });
});
