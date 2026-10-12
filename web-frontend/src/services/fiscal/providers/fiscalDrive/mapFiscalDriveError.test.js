import { describe, expect, it } from 'vitest';
import { mapFiscalDriveError } from './mapFiscalDriveError';

const CLOSE_Z_DUMP = [
  '"n":"9091 - ME_SYNC_WITH_SERVER"',
  '"Type":"*applet0400.SWError"',
  '"Action":"ofd-us/common/lib/applet/applet0400.CloseZReport"',
  '"At":"applet_impl.go:300"',
  '"Message":"zreport"',
  '{"Message":"failed to execute command"}',
].join(',');

describe('mapFiscalDriveError', () => {
  it('maps applet CloseZReport 9091 without 0x prefix', () => {
    const err = mapFiscalDriveError(new Error(CLOSE_Z_DUMP));
    expect(err.message).toBe('Часы ФМ впереди — нужна синхронизация времени');
    expect(err.fiscalDriveCode).toBe('0x9091');
    expect(err.code).toBe('FISCAL_DRIVE_FISCAL_FAILED');
  });

  it('still maps 0x codes', () => {
    const err = mapFiscalDriveError(new Error('FiscalDrive: 0x9032'));
    expect(err.message).toBe('Нельзя закрыть пустой Z-отчёт');
    expect(err.fiscalDriveCode).toBe('0x9032');
  });

  it('keeps a plain message', () => {
    const err = mapFiscalDriveError(new Error('Локальная служба недоступна'));
    expect(err.message).toBe('Локальная служба недоступна');
    expect(err.fiscalDriveCode).toBeNull();
  });

  it('hides an unknown applet dump behind the code', () => {
    const err = mapFiscalDriveError(
      new Error('"n":"90ab - SOME_APPLET_FAULT","Type":"*applet0400.SWError","Message":"failed to execute command"'),
    );
    expect(err.message).toBe('Ошибка фискального модуля (90ab — SOME_APPLET_FAULT)');
    expect(err.fiscalDriveCode).toBe('0x90ab');
  });
});
