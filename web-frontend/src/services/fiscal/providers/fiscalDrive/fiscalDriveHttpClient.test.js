import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFiscalDriveInfo,
  listFiscalDrives,
  parseFiscalDriveFactoryIds,
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
    });
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
});
