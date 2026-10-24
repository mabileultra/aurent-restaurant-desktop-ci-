import { describe, expect, it } from 'vitest';
import {
  isFiscalDriveNeedsSyncError,
  isFiscalDriveShiftAlreadyOpenError,
  isFiscalDriveZNotOpenError,
  mapFiscalDriveError,
} from './mapFiscalDriveError';

const CLOSE_Z_DUMP = [
  '"n":"9091 - ME_SYNC_WITH_SERVER"',
  '"Type":"*applet0400.SWError"',
  '"Action":"ofd-us/common/lib/applet/applet0400.CloseZReport"',
  '"At":"applet_impl.go:300"',
  '"Message":"zreport"',
  '{"Message":"failed to execute command"}',
].join(',');

describe('mapFiscalDriveError', () => {
  it('апплет CloseZReport 9091 без префикса 0x', () => {
    const err = mapFiscalDriveError(new Error(CLOSE_Z_DUMP));
    expect(err.message).toBe('Часы ФМ впереди — нужна синхронизация времени');
    expect(err.fiscalDriveCode).toBe('0x9091');
    expect(err.code).toBe('FISCAL_DRIVE_FISCAL_FAILED');
  });

  it('код 0x тоже мапится в текст', () => {
    const err = mapFiscalDriveError(new Error('FiscalDrive: 0x9032'));
    expect(err.message).toBe('Нельзя закрыть пустой Z-отчёт');
    expect(err.fiscalDriveCode).toBe('0x9032');
  });

  it('простой текст службы не переписываем', () => {
    const err = mapFiscalDriveError(new Error('Локальная служба недоступна'));
    expect(err.message).toBe('Локальная служба недоступна');
    expect(err.fiscalDriveCode).toBeNull();
  });

  it('неизвестный дамп апплета прячем за кодом', () => {
    const err = mapFiscalDriveError(
      new Error('"n":"90ab - SOME_APPLET_FAULT","Type":"*applet0400.SWError","Message":"failed to execute command"'),
    );
    expect(err.message).toBe('Ошибка фискального модуля (90ab — SOME_APPLET_FAULT)');
    expect(err.fiscalDriveCode).toBe('0x90ab');
  });

  it('пустая дата чека — без дампа Go ParseError', () => {
    const err = Object.assign(new Error('HTTP 500'), {
      status: 500,
      data: {
        Reason: 'parsing time "" as "2006-01-02 15:04:05": cannot parse "" as "2006"',
        Type: '*time.ParseError',
        CallLog: [{ Message: 'invalid DateTime field value' }],
      },
    });
    expect(mapFiscalDriveError(err).message).toMatch(/не принял дату чека/);
  });

  it('различает Z уже открыт / не открыт / нужна синхронизация', () => {
    expect(isFiscalDriveShiftAlreadyOpenError(mapFiscalDriveError(new Error('0x9022')))).toBe(true);
    expect(isFiscalDriveZNotOpenError(mapFiscalDriveError(new Error('0x9021')))).toBe(true);
    expect(isFiscalDriveNeedsSyncError(mapFiscalDriveError(new Error('0x9091')))).toBe(true);
  });
});

