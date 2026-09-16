import { describe, it, expect } from 'vitest';
import { resolveFiscalReceiptMeta, resolveReceiptPaymentAmounts } from './resolveFiscalReceiptMeta';

const SALE = {
  receiptNumber: 'RCP-20260916-0020',
  paymentMethod: 'CASH',
  totalAmount: 25000,
  amountTendered: 25000,
  cashAmount: 0,
  cardAmount: 25000,
  fiscalSign: '438580950279',
  fiscalReceiptSeq: '4',
  fiscalTerminalId: 'VG544170030015',
  fiscalQrUrl: 'https://ofd.soliq.uz/check?t=VG544170030015&r=4&c=20260916152500&s=438580950279',
  printFiscalQr: true,
};

describe('resolveFiscalReceiptMeta', () => {
  it('uses GNK FM / seq / ofd QR, not POS receipt number', () => {
    const meta = resolveFiscalReceiptMeta(SALE, { virtualRegister: '1', fmNumber: '' });
    expect(meta.fmNumber).toBe('VG544170030015');
    expect(meta.fiscalReceiptNo).toBe('4');
    expect(meta.fiscalSign).toBe('438580950279');
    expect(meta.qrValue).toContain('ofd.soliq.uz/check');
    expect(meta.qrValue).toContain('t=VG544170030015');
    expect(meta.virtualRegister).toBe('');
  });

  it('does not print a non-tax QR', () => {
    const meta = resolveFiscalReceiptMeta(
      {
        ...SALE,
        fiscalQrUrl: 'https://example.com/check?r=1',
        fiscalSign: null,
        fiscalReceiptSeq: null,
        fiscalTerminalId: null,
        printFiscalQr: true,
      },
      {},
    );
    expect(meta.qrValue).toBe('');
  });
});

describe('resolveReceiptPaymentAmounts', () => {
  it('prefers explicit cardAmount over paymentMethod CASH', () => {
    const pay = resolveReceiptPaymentAmounts(SALE);
    expect(pay.cardAmt).toBe(25000);
    expect(pay.cashAmt).toBe(0);
  });
});
