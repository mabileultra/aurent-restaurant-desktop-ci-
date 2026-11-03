import {
  closeZReport,
  FISCAL_DRIVE_DEFAULT_BASE_URL,
  listFiscalDrives,
  parseFiscalDriveFactoryIds,
} from './fiscalDriveHttpClient';
import { ensureFiscalDriveReady, resolveFiscalDriveFactoryId } from './ensureFiscalDriveReady';
import { isFiscalDriveShiftAlreadyOpenError, mapFiscalDriveError } from './mapFiscalDriveError';

export { isFiscalDriveShiftAlreadyOpenError };

const SHIFT_NEEDS_MODULE = 'Вы не можете открыть смену. Вставьте фискальный модуль.';

function moduleMissing() {
  const err = new Error(SHIFT_NEEDS_MODULE);
  err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
  return err;
}

async function assertFiscalModulePresent(baseUrl) {
  let ids = [];
  try {
    ids = parseFiscalDriveFactoryIds(await listFiscalDrives(baseUrl));
  } catch {
    throw moduleMissing();
  }
  if (!ids.length) throw moduleMissing();
}

function isFiscalDriveCaps(capabilities) {
  return (
    String(capabilities?.fiscalProvider || '').toUpperCase() === 'FISCAL_DRIVE' ||
    Boolean(capabilities?.enabled)
  );
}

/**
 * Открытие/закрытие Z-отчёта ФМ 0400.
 * kind: 'OPEN' | 'CLOSE' | 'X_REPORT' (X — no-op, у FD нет отдельного X).
 */
export async function fiscalizeShiftOperation({ kind, capabilities }) {
  if (!isFiscalDriveCaps(capabilities)) return null;

  const upper = String(kind || '').toUpperCase();
  if (upper === 'X_REPORT' || upper === 'X') return null;

  const baseUrl = String(capabilities?.baseUrl || '').trim() || FISCAL_DRIVE_DEFAULT_BASE_URL;

  try {
    if (upper === 'OPEN' || upper === 'OPEN_SHIFT') {
      await assertFiscalModulePresent(baseUrl);
      const ready = await ensureFiscalDriveReady({
        baseUrl,
        factoryId: capabilities?.factoryId,
      });
      return { ok: true, kind: 'OPEN', factoryId: ready.factoryId };
    }
    if (upper === 'CLOSE' || upper === 'CLOSE_SHIFT') {
      const factoryId = await resolveFiscalDriveFactoryId(baseUrl, capabilities?.factoryId);
      await closeZReport(baseUrl, factoryId);
      return { ok: true, kind: 'CLOSE', factoryId };
    }
    return null;
  } catch (err) {
    throw mapFiscalDriveError(err);
  }
}
