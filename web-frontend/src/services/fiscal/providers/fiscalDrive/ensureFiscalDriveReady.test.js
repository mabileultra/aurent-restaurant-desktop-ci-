import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./fiscalDriveHttpClient', async () => {
  const actual = await vi.importActual('./fiscalDriveHttpClient');
  return {
    ...actual,
    listFiscalDrives: vi.fn(),
    getFiscalDriveInfo: vi.fn(),
    openZReport: vi.fn(),
    syncFiscalDriveState: vi.fn(),
  };
});

import { ensureFiscalDriveReady } from './ensureFiscalDriveReady';
import {
  getFiscalDriveInfo,
  listFiscalDrives,
  openZReport,
  syncFiscalDriveState,
} from './fiscalDriveHttpClient';

describe('ensureFiscalDriveReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFiscalDrives.mockResolvedValue([]);
    openZReport.mockResolvedValue('OK');
    syncFiscalDriveState.mockResolvedValue('OK');
  });

  it('syncs then opens Z when Info.Locked is true', async () => {
    getFiscalDriveInfo.mockResolvedValue({ Locked: true, TerminalID: 'zz000000000000' });

    const ready = await ensureFiscalDriveReady({
      baseUrl: 'http://127.0.0.1:3449',
      factoryId: 'FACTORY-1',
    });

    expect(syncFiscalDriveState).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1');
    expect(openZReport).toHaveBeenCalledWith('http://127.0.0.1:3449', 'FACTORY-1');
    expect(ready.terminalId).toBe('ZZ000000000000');
  });

  it('treats already-open Z as ready', async () => {
    getFiscalDriveInfo.mockResolvedValue({ Locked: false });
    openZReport.mockRejectedValue(new Error('0x9022'));

    await expect(
      ensureFiscalDriveReady({ baseUrl: 'http://127.0.0.1:3449', factoryId: 'FACTORY-1' }),
    ).resolves.toMatchObject({ factoryId: 'FACTORY-1' });
  });

  it('picks FactoryID from List when settings omit it', async () => {
    listFiscalDrives.mockResolvedValue([{ FactoryID: 'FROM-LIST' }]);
    getFiscalDriveInfo.mockResolvedValue({ Locked: false });

    const ready = await ensureFiscalDriveReady({ baseUrl: 'http://127.0.0.1:3449', factoryId: '' });
    expect(ready.factoryId).toBe('FROM-LIST');
  });
});
