import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/resolveFiscalPackageCodes', () => ({
  enrichFiscalPackageCodes: async (items) => items,
  isRealFiscalPackageCode: (code) => Boolean(code && code !== '1'),
}));
vi.mock('../../shared/expandMarkedFiscalItems', () => ({
  expandMarkedFiscalItems: (items) => items,
}));
vi.mock('./validateFiscalMarking', () => ({
  MARKING_VALIDATION_STATUS: { VALID: 'VALID', REJECTED: 'REJECTED', UNAVAILABLE: 'UNAVAILABLE', NOT_REQUIRED: 'NOT_REQUIRED' },
  validateFiscalMarking: vi.fn(async () => ({ status: 'NOT_REQUIRED' })),
}));
vi.mock('./fiscalDriveHttpClient', async () => {
  const actual = await vi.importActual('./fiscalDriveHttpClient');
  return {
    ...actual,
    getReceiptTxid: vi.fn(),
    registerReceiptTxid: vi.fn(),
  };
});
vi.mock('../../../desktop/activityLog', () => ({ logFiscal: vi.fn() }));

import { fiscalizeSaleBeforeCommit } from './fiscalizeSaleBeforeCommit';
import { getReceiptTxid, registerReceiptTxid } from './fiscalDriveHttpClient';
import { FISCAL_STATUS } from '../../fiscalStatus';

const caps = {
  enabled: true,
  cashRegisterId: 11,
  baseUrl: 'http://127.0.0.1:3449',
  factoryId: 'FACTORY-1',
  terminalId: 'ZZ000000000000',
  requireBeforeSale: true,
  printFiscalQr: true,
};

const cartItems = [
  {
    name: 'Товар',
    ikpu: '02208005001025008',
    packageCode: '1077302',
    quantity: 1,
    unitPrice: 1000,
    taxRate: 12,
  },
];

describe('fiscalizeSaleBeforeCommit FiscalDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when disabled', async () => {
    await expect(fiscalizeSaleBeforeCommit({ capabilities: { enabled: false }, cartItems })).resolves.toBeNull();
  });

  it('GetTXID then RegisterTXID and returns fiscal proof', async () => {
    getReceiptTxid.mockResolvedValue({ TXID: 15 });
    registerReceiptTxid.mockResolvedValue({
      TerminalID: 'ZZ000000000000',
      ReceiptSeq: 3,
      DateTime: '2024-09-04 09:45:38',
      FiscalSign: '320262508539',
      QRCodeURL: 'https://ofd.soliq.uz/check?t=ZZ000000000000&r=3&c=20240904094538&s=320262508539',
    });

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: caps,
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(getReceiptTxid).toHaveBeenCalledOnce();
    expect(registerReceiptTxid).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1', '15');
    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(payload.fiscalSign).toBe('320262508539');
    expect(payload.fiscalDriveTxid).toBe('15');
    expect(payload.fiscalProvider).toBe('FISCAL_DRIVE');
    expect(payload.fiscalQrUrl).toContain('ofd.soliq.uz/check');
  });

  it('builds ofd QR from caps.terminalId when Register omits TerminalID/QR', async () => {
    getReceiptTxid.mockResolvedValue(21);
    registerReceiptTxid.mockResolvedValue({
      ReceiptSeq: 7,
      DateTime: '2024-09-04 09:45:38',
      FiscalSign: '320262508539',
    });

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: { ...caps, terminalId: 'ZZ000000000000' },
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(payload.fiscalTerminalId).toBe('ZZ000000000000');
    expect(payload.fiscalQrUrl).toBe(
      'https://ofd.soliq.uz/check?t=ZZ000000000000&r=7&c=20240904094538&s=320262508539',
    );
  });
});
