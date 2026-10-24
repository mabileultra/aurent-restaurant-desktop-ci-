import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFiscalDriveInfo,
  getReceiptTxid,
  isEmptyFiscalDateTimeError,
  listFiscalDrives,
  normalizeReceiptTxid,
  parseFiscalDriveFactoryIds,
  parseReceiptTxid,
  registerReceiptTxid,
  summarizeFiscalDriveInfo,
} from './fiscalDriveHttpClient';

const FACTORY_ID = '002024083000152503000000000000000000';

describe('parseFiscalDriveFactoryIds', () => {
  it('accepts a plain array of strings', () => {
    expect(parseFiscalDriveFactoryIds([FACTORY_ID, ` ${FACTORY_ID} `])).toEqual([FACTORY_ID]);
  });

  it('accepts wrapped objects with FactoryID in any casing', () => {
    expect(
      parseFiscalDriveFactoryIds({ FiscalDrives: [{ FactoryID: 'A' }, { factoryId: 'B' }, {}] }),
    ).toEqual(['A', 'B']);
  });

  it('finds FactoryID nested under data', () => {
    expect(
      parseFiscalDriveFactoryIds({ data: { items: [{ FactoryID: FACTORY_ID }] } }),
    ).toEqual([FACTORY_ID]);
  });

  it('returns empty for garbage', () => {
    expect(parseFiscalDriveFactoryIds(null)).toEqual([]);
    expect(parseFiscalDriveFactoryIds('oops')).toEqual([]);
  });
});

describe('summarizeFiscalDriveInfo', () => {
  it('extracts TerminalID upper-cased', () => {
    expect(summarizeFiscalDriveInfo({ TerminalID: 'zz000000000000', AppletVersion: '0400' })).toEqual({
      terminalId: 'ZZ000000000000',
      version: '0400',
      locked: false,
    });
  });

  it('reads Locked from Info', () => {
    expect(summarizeFiscalDriveInfo({ Locked: true }).locked).toBe(true);
  });
});

describe('fiscalDrive HTTP', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubDesktop = (localDeviceRequest) =>
    vi.stubGlobal('window', { desktopCashier: { isDesktop: true, localDeviceRequest } });

  it('goes through desktop localDeviceRequest when available', async () => {
    const localDeviceRequest = vi.fn().mockResolvedValue({ ok: true, status: 200, data: [FACTORY_ID] });
    stubDesktop(localDeviceRequest);

    await expect(listFiscalDrives('http://127.0.0.1:3449/')).resolves.toEqual([FACTORY_ID]);
    expect(localDeviceRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: 'http://127.0.0.1:3449/FiscalDrive/List' }),
    );
  });

  it('surfaces service error message', async () => {
    stubDesktop(vi.fn().mockResolvedValue({ ok: false, status: 404, data: { Message: 'not found' } }));
    await expect(getFiscalDriveInfo('http://127.0.0.1:3449', FACTORY_ID)).rejects.toMatchObject({
      message: 'not found',
      status: 404,
    });
  });

  it('retries List with POST when GET is not allowed', async () => {
    const localDeviceRequest = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 405, data: { message: 'method not allowed' } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: [{ FactoryID: FACTORY_ID }] });
    stubDesktop(localDeviceRequest);

    await expect(listFiscalDrives('http://127.0.0.1:3449')).resolves.toEqual([
      { FactoryID: FACTORY_ID },
    ]);
    expect(localDeviceRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(localDeviceRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ method: 'POST', body: {} }),
    );
  });

  it('GetTXID retries raw JSON when form comes back as empty DateTime 500', async () => {
    const localDeviceRequest = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: {
          Reason: 'parsing time "" as "2006-01-02 15:04:05": cannot parse "" as "2006"',
          Type: '*time.ParseError',
          CallLog: [{ Message: 'invalid DateTime field value' }],
        },
      })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { TXID: 15 } });
    stubDesktop(localDeviceRequest);

    const receipt = { Time: '2024-09-04 09:45:38', Items: [] };
    await expect(getReceiptTxid('http://127.0.0.1:3449', FACTORY_ID, receipt)).resolves.toEqual({
      TXID: 15,
    });
    expect(localDeviceRequest).toHaveBeenCalledTimes(2);
    expect(localDeviceRequest.mock.calls[0][0].body).toContain('JsonReceipt=');
    expect(localDeviceRequest.mock.calls[1][0].body).toEqual(receipt);
    expect(isEmptyFiscalDateTimeError({
      data: { CallLog: [{ Message: 'invalid DateTime field value' }] },
    })).toBe(true);
  });

  it('RegisterTXID sends form-urlencoded TXID (swagger field)', async () => {
    const localDeviceRequest = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { FiscalSign: '1', ReceiptSeq: 1 },
    });
    stubDesktop(localDeviceRequest);

    await registerReceiptTxid('http://127.0.0.1:3449', FACTORY_ID, '42');
    expect(localDeviceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: 'TXID=42',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        }),
      }),
    );
  });
});

describe('parseReceiptTxid', () => {
  it('normalizes plain and wrapped values', () => {
    expect(normalizeReceiptTxid('15')).toBe('15');
    expect(parseReceiptTxid(15)).toBe('15');
    expect(parseReceiptTxid({ TXID: 9 })).toBe('9');
    expect(parseReceiptTxid({ result: 11 })).toBe('11');
    expect(parseReceiptTxid({ Code: 0, data: { txid: '3' } })).toBe('3');
    expect(parseReceiptTxid({ TXID: '' })).toBeNull();
    expect(parseReceiptTxid('abc')).toBeNull();
  });
});
