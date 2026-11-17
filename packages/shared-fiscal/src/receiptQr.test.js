import { describe, it, expect } from 'vitest';
import {
  shouldPrintFiscalQr,
  isAdvanceOrCreditReceipt,
  FISCAL_QR_SUPPRESSED_RECEIPT_TYPES,
} from './receiptQr.js';

describe('shouldPrintFiscalQr & isAdvanceOrCreditReceipt', () => {
  it('suppresses QR for ADVANCE and CREDIT receipt types', () => {
    expect(shouldPrintFiscalQr('ADVANCE')).toBe(false);
    expect(shouldPrintFiscalQr('advance')).toBe(false);
    expect(shouldPrintFiscalQr('CREDIT')).toBe(false);
    expect(shouldPrintFiscalQr('credit')).toBe(false);
    expect(shouldPrintFiscalQr('AVANCE')).toBe(false);
    expect(shouldPrintFiscalQr('avance')).toBe(false);

    expect(isAdvanceOrCreditReceipt('ADVANCE')).toBe(true);
    expect(isAdvanceOrCreditReceipt('CREDIT')).toBe(true);
  });

  it('allows QR for SALE and RETURN and default types', () => {
    expect(shouldPrintFiscalQr('SALE')).toBe(true);
    expect(shouldPrintFiscalQr('sale')).toBe(true);
    expect(shouldPrintFiscalQr('RETURN')).toBe(true);
    expect(shouldPrintFiscalQr('return')).toBe(true);
    expect(shouldPrintFiscalQr('')).toBe(true);
    expect(shouldPrintFiscalQr(null)).toBe(true);
    expect(shouldPrintFiscalQr(undefined)).toBe(true);

    expect(isAdvanceOrCreditReceipt('SALE')).toBe(false);
    expect(isAdvanceOrCreditReceipt('RETURN')).toBe(false);
  });

  it('inspects receiptType or type property when an object is passed', () => {
    expect(shouldPrintFiscalQr({ receiptType: 'ADVANCE' })).toBe(false);
    expect(shouldPrintFiscalQr({ receiptType: 'CREDIT' })).toBe(false);
    expect(shouldPrintFiscalQr({ receiptType: 'SALE' })).toBe(true);
    expect(shouldPrintFiscalQr({ receiptType: 'RETURN' })).toBe(true);
    expect(shouldPrintFiscalQr({ type: 'advance' })).toBe(false);
    expect(shouldPrintFiscalQr({ type: 'credit' })).toBe(false);
    expect(shouldPrintFiscalQr({})).toBe(true);

    expect(isAdvanceOrCreditReceipt({ receiptType: 'ADVANCE' })).toBe(true);
    expect(isAdvanceOrCreditReceipt({ receiptType: 'SALE' })).toBe(false);
  });

  it('has immutable set of suppressed types', () => {
    expect(FISCAL_QR_SUPPRESSED_RECEIPT_TYPES.has('ADVANCE')).toBe(true);
    expect(FISCAL_QR_SUPPRESSED_RECEIPT_TYPES.has('CREDIT')).toBe(true);
    expect(FISCAL_QR_SUPPRESSED_RECEIPT_TYPES.has('SALE')).toBe(false);
  });
});
