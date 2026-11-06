import {
  FISCAL_DRIVE_DEFAULT_BASE_URL,
  getFiscalDriveInfo,
  listFiscalDrives,
  openZReport,
  parseFiscalDriveFactoryIds,
  summarizeFiscalDriveInfo,
  syncFiscalDriveState,
} from './fiscalDriveHttpClient';
import {
  isFiscalDriveNeedsSyncError,
  isFiscalDriveShiftAlreadyOpenError,
  mapFiscalDriveError,
} from './mapFiscalDriveError';

function fail(message) {
  const err = new Error(message);
  err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
  return err;
}

export async function resolveFiscalDriveFactoryId(baseUrl, factoryId) {
  const given = String(factoryId || '').trim();
  if (given) return given;
  const ids = parseFiscalDriveFactoryIds(await listFiscalDrives(baseUrl));
  if (ids.length === 0) {
    throw fail(
      'FiscalDriveService не видит ФМ. Подключите модуль и проверьте службу на 127.0.0.1:3449.',
    );
  }
  return ids[0];
}

export async function openFiscalDriveZReport(baseUrl, factoryId) {
  try {
    await openZReport(baseUrl, factoryId);
  } catch (err) {
    if (isFiscalDriveShiftAlreadyOpenError(err)) return;
    if (isFiscalDriveNeedsSyncError(err)) {
      await syncFiscalDriveState(baseUrl, factoryId);
      try {
        await openZReport(baseUrl, factoryId);
        return;
      } catch (retryErr) {
        if (isFiscalDriveShiftAlreadyOpenError(retryErr)) return;
        throw mapFiscalDriveError(retryErr);
      }
    }
    throw mapFiscalDriveError(err);
  }
}

/**
 * Перед GetTXID/RegisterTXID: FactoryID с List если не задан, State/Sync если Locked, открыть Z.
 */
export async function ensureFiscalDriveReady({ baseUrl, factoryId } = {}) {
  const url = String(baseUrl || '').trim() || FISCAL_DRIVE_DEFAULT_BASE_URL;
  const id = await resolveFiscalDriveFactoryId(url, factoryId);

  let info = { terminalId: null, locked: false };
  try {
    info = summarizeFiscalDriveInfo(await getFiscalDriveInfo(url, id));
  } catch {
    /* List/Open всё равно попробуем — Info может быть недоступен на эмуляторе */
  }

  if (info.locked) {
    await syncFiscalDriveState(url, id);
  }

  await openFiscalDriveZReport(url, id);
  return { baseUrl: url, factoryId: id, terminalId: info.terminalId || null };
}
