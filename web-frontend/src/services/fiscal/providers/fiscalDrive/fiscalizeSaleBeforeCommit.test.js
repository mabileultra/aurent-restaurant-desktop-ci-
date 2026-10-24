import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/resolveFiscalPackageCodes', () => ({
  enrichFiscalPackageCodes: async (items) => items,
  isRealFiscalPackageCode: (code) => Boolean(code && code !== '1'),
}));
vi.mock('../../shared/expandMarkedFiscalItems', () => ({
  expandMarkedFiscalItems: (items) => items,
}));
vi.mock('../../shared/assertOnkmMarking', () => ({
  assertOnkmMarking: vi.fn(async () => undefined),
}));
vi.mock('./fiscalDriveHttpClient', async () => {
  const actual = await vi.importActual('./fiscalDriveHttpClient');
  return {
    ...actual,
    getReceiptTxid: vi.fn(),
    registerReceiptTxid: vi.fn(),
    listFiscalDrives: vi.fn(),
    getFiscalDriveInfo: vi.fn(),
    openZReport: vi.fn(),
    syncFiscalDriveState: vi.fn(),
    syncFullReceipts: vi.fn(),
  };
});
vi.mock('../../../desktop/activityLog', () => ({ logFiscal: vi.fn() }));

import { fiscalizeSaleBeforeCommit } from './fiscalizeSaleBeforeCommit';
import {
  getFiscalDriveInfo,
  getReceiptTxid,
  listFiscalDrives,
  openZReport,
  registerReceiptTxid,
  syncFiscalDriveState,
  syncFullReceipts,
} from './fiscalDriveHttpClient';
import { FISCAL_STATUS } from '../../fiscalStatus';

const caps = {
  enabled: true,
  fiscalProvider: 'FISCAL_DRIVE',
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

const REGISTERED = {
  TerminalID: 'ZZ000000000000',
  ReceiptSeq: 3,
  DateTime: '2024-09-04 09:45:38',
  FiscalSign: '320262508539',
  QRCodeURL: 'https://ofd.soliq.uz/check?t=ZZ000000000000&r=3&c=20240904094538&s=320262508539',
};

describe('fiscalizeSaleBeforeCommit FiscalDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFiscalDriveInfo.mockResolvedValue({ Locked: false, TerminalID: 'ZZ000000000000' });
    openZReport.mockResolvedValue('OK');
    syncFiscalDriveState.mockResolvedValue('OK');
    syncFullReceipts.mockResolvedValue({ SuccessfulsCount: 1 });
    listFiscalDrives.mockResolvedValue([{ FactoryID: 'FACTORY-1' }]);
  });

  it('returns null when another provider is disabled', async () => {
    await expect(fiscalizeSaleBeforeCommit({ capabilities: { enabled: false }, cartItems })).resolves.toBeNull();
  });

  it('GetTXID then RegisterTXID and returns fiscal proof', async () => {
    getReceiptTxid.mockResolvedValue({ TXID: 15 });
    registerReceiptTxid.mockResolvedValue(REGISTERED);

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: caps,
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(openZReport).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1');
    expect(getReceiptTxid).toHaveBeenCalledOnce();
    expect(registerReceiptTxid).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1', '15');
    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(payload.fiscalSign).toBe('320262508539');
    expect(payload.fiscalDriveTxid).toBe('15');
    expect(payload.fiscalProvider).toBe('FISCAL_DRIVE');
    expect(payload.fiscalQrUrl).toContain('ofd.soliq.uz/check');
  });

  it('still requires RegisterTXID when Multikassa requireBeforeSale is false', async () => {
    getReceiptTxid.mockResolvedValue({ TXID: 15 });
    registerReceiptTxid.mockResolvedValue(REGISTERED);

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: { ...caps, requireBeforeSale: false },
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(payload.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(payload.fiscalQrUrl).toContain('ofd.soliq.uz/check');
  });

  it('lists FactoryID when settings omit it', async () => {
    getReceiptTxid.mockResolvedValue({ TXID: 9 });
    registerReceiptTxid.mockResolvedValue(REGISTERED);

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: { ...caps, enabled: false, factoryId: '' },
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(listFiscalDrives).toHaveBeenCalledWith('http://127.0.0.1:3449');
    expect(registerReceiptTxid).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1', '9');
    expect(payload.fiscalSign).toBe('320262508539');
  });

  it('opens Z and retries RegisterTXID with the same TXID on 0x9021', async () => {
    getReceiptTxid.mockResolvedValue({ TXID: 15 });
    const zClosed = new Error('0x9021 Z-отчёт не открыт');
    zClosed.status = 400;
    registerReceiptTxid.mockRejectedValueOnce(zClosed).mockResolvedValueOnce(REGISTERED);

    const payload = await fiscalizeSaleBeforeCommit({
      capabilities: caps,
      cartItems,
      payment: { paymentMethod: 'CASH', cashAmount: 1000 },
      total: 1000,
    });

    expect(getReceiptTxid).toHaveBeenCalledOnce();
    expect(registerReceiptTxid).toHaveBeenCalledTimes(2);
    expect(registerReceiptTxid).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:3449', 'FACTORY-1', '15');
    expect(payload.fiscalSign).toBe('320262508539');
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
