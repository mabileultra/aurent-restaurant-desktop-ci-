import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildOfdCheckUrl,
  isOfdCheckUrl,
  isSyntheticFiscalSign,
  parseOfdCheckParams,
} from './ofdQrUrl';
import { buildFiscalSign, buildQrPayload } from './fiscalReceiptFormat';
import {
  ensureFiscalQrUrl,
  hasRealFiscalProof,
  parseMultikassaOperationResult,
  toSaleFiscalPayload,
} from '../services/multikassa/parseMultikassaResult';

describe('ofdQrUrl', () => {
  it('builds official GNK check URL only with full real proof', () => {
    const url = buildOfdCheckUrl({
      terminalId: 'TERM1',
      receiptSeq: '42',
      fiscalSign: 'SIGN99',
      datetime: '2026-09-07T05:26:36',
    });
    expect(url).toMatch(/^https:\/\/ofd\.soliq\.uz\/check\?/);
    expect(isOfdCheckUrl(url)).toBe(true);
    expect(parseOfdCheckParams(url)).toEqual({
      terminalId: 'TERM1',
      receiptSeq: '42',
      datetime: expect.stringMatching(/^\d{14}$/),
      fiscalSign: 'SIGN99',
    });
  });

  it('refuses synthetic MK- signs', () => {
    expect(isSyntheticFiscalSign('MK-123')).toBe(true);
    expect(
      buildOfdCheckUrl({
        terminalId: 'T',
        receiptSeq: '1',
        fiscalSign: 'MK-123',
        datetime: '20260907120000',
      }),
    ).toBe('');
  });

  it('returns empty QR when terminal missing — reproduces blank receipt QR', () => {
    expect(
      buildOfdCheckUrl({
        terminalId: '',
        receiptSeq: '42',
        fiscalSign: 'REALSIGN',
        datetime: '20260907120000',
      }),
    ).toBe('');
  });
});

describe('buildQrPayload / receipt', () => {
  it('returns empty when sale has no fiscal fields (pharmacy symptom)', () => {
    const sale = {
      receiptNumber: 'RCP-20260907-0005',
      createdAt: '2026-09-07T05:26:36',
      fiscalSign: null,
      fiscalQrUrl: null,
      fiscalReceiptSeq: null,
    };
    expect(buildFiscalSign(sale)).toBe('');
    expect(buildQrPayload(sale)).toBe('');
  });

  it('rebuilds OFD URL from sign+seq+stored terminal', () => {
    const sale = {
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      fiscalTerminalId: 'TERM1',
      fiscalizedAt: '2026-09-07T05:26:36',
    };
    const qr = buildQrPayload(sale);
    expect(isOfdCheckUrl(qr)).toBe(true);
    expect(qr).toContain('t=TERM1');
    expect(qr).toContain('s=SIGN99');
  });

  it('uses fiscalQrUrl from Multikassa when present', () => {
    const url = 'https://ofd.soliq.uz/check?t=T1&r=9&c=20260907120000&s=S1';
    expect(buildQrPayload({ fiscalQrUrl: url })).toBe(url);
  });
  it('respects printFiscalQr=false — receipt must not build QR payload for UI', () => {
    const sale = {
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      fiscalTerminalId: 'TERM1',
      fiscalizedAt: '2026-09-07T05:26:36',
      fiscalQrUrl: 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99',
      printFiscalQr: false,
    };
    const printFiscalQr = sale.printFiscalQr !== false;
    const qrValue = printFiscalQr ? buildQrPayload(sale) : '';
    expect(printFiscalQr).toBe(false);
    expect(qrValue).toBe('');
  });
});

describe('parseMultikassaOperationResult', () => {
  it('extracts QR and terminal from module response', () => {
    const parsed = parseMultikassaOperationResult(
      {
        Code: 0,
        Result: {
          receipt_gnk_fiscalsign: 'SIGN99',
          receipt_gnk_receiptseq: '42',
          receipt_gnk_terminalid: 'TERM1',
          receipt_gnk_time: '20260907122636',
          QRCodeURL: 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99',
        },
      },
      { terminalId: 'TERM1' },
    );
    expect(hasRealFiscalProof(parsed)).toBe(true);
    expect(parsed.fiscalQrUrl).toContain('ofd.soliq.uz');
    expect(toSaleFiscalPayload(parsed).fiscalTerminalId).toBe('TERM1');
  });

  it('builds OFD QR from hints when module omits QRCodeURL', () => {
    const parsed = ensureFiscalQrUrl(
      {
        fiscalSign: 'SIGN99',
        fiscalReceiptSeq: '42',
        terminalId: null,
        datetime: '20260907122636',
        fiscalQrUrl: null,
      },
      { terminalId: 'TERM1', datetime: '20260907122636' },
    );
    expect(isOfdCheckUrl(parsed.fiscalQrUrl)).toBe(true);
  });
});

describe('loadMultikassaCapabilities', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('does not treat API errors as enabled:false (silent non-fiscal bug)', async () => {
    vi.doMock('../api/multikassa.api', () => ({
      multikassaApi: {
        getCashierCapabilities: vi.fn().mockRejectedValue(new Error('network')),
      },
    }));
    const { loadMultikassaCapabilities } = await import(
      '../services/multikassa/loadMultikassaCapabilities'
    );
    await expect(loadMultikassaCapabilities(1, 2)).rejects.toMatchObject({
      code: 'MULTIKASSA_CAPABILITIES_LOAD_FAILED',
    });
  });

  it('allows soft-disable only when explicitly requested (offline)', async () => {
    vi.doMock('../api/multikassa.api', () => ({
      multikassaApi: {
        getCashierCapabilities: vi.fn().mockRejectedValue(new Error('network')),
      },
    }));
    const { loadMultikassaCapabilities } = await import(
      '../services/multikassa/loadMultikassaCapabilities'
    );
    const caps = await loadMultikassaCapabilities(1, 2, { allowLoadFailureAsDisabled: true });
    expect(caps).toEqual({ enabled: false, loadFailed: true });
  });
});
