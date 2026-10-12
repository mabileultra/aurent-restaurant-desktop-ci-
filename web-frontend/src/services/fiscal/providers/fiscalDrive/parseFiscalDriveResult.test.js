import { describe, expect, it } from 'vitest';
import { parseFiscalDriveRegisterResult, toFiscalDriveSalePayload } from './parseFiscalDriveResult';
import { parseReceiptTxid } from './fiscalDriveHttpClient';
import { FISCAL_STATUS } from '../../fiscalStatus';

describe('parseReceiptTxid', () => {
  it('accepts number, string and object', () => {
    expect(parseReceiptTxid(42)).toBe('42');
    expect(parseReceiptTxid({ TXID: 7 })).toBe('7');
    expect(parseReceiptTxid(null)).toBeNull();
  });
});

describe('parseFiscalDriveRegisterResult', () => {
  it('parses RegisterTXID example from docs', () => {
    const parsed = parseFiscalDriveRegisterResult({
      TerminalID: 'ZZ000000000000',
      ReceiptSeq: 1,
      DateTime: '2024-09-04 09:45:38',
      FiscalSign: '320262508539',
      QRCodeURL: 'https://ofd.soliq.uz/check?t=ZZ000000000000&r=1&c=20240904094538&s=320262508539',
    });
    expect(parsed.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(parsed.fiscalSign).toBe('320262508539');
    expect(parsed.fiscalReceiptSeq).toBe('1');
    expect(parsed.fiscalQrUrl).toContain('ofd.soliq.uz/check');
    expect(toFiscalDriveSalePayload(parsed, { txid: '9' }).fiscalDriveTxid).toBe('9');
  });

  it('builds QR when service omitted it', () => {
    const parsed = parseFiscalDriveRegisterResult({
      TerminalID: 'ZZ000000000000',
      ReceiptSeq: 2,
      DateTime: '2024-09-04 09:45:38',
      FiscalSign: '320262508539',
    });
    expect(parsed.fiscalQrUrl).toBe(
      'https://ofd.soliq.uz/check?t=ZZ000000000000&r=2&c=20240904094538&s=320262508539',
    );
  });
});
