import { closeZReport, openZReport } from './fiscalDriveHttpClient';
import { mapFiscalDriveError } from './mapFiscalDriveError';

/**
 * Открытие/закрытие Z-отчёта ФМ 0400.
 * kind: 'OPEN' | 'CLOSE' | 'X_REPORT' (X — no-op, у FD нет отдельного X).
 */
export async function fiscalizeShiftOperation({ kind, capabilities }) {
  if (!capabilities?.enabled) return null;
  const factoryId = String(capabilities.factoryId || '').trim();
  const baseUrl = String(capabilities.baseUrl || '').trim();
  if (!factoryId || !baseUrl) {
    const err = new Error('FiscalDrive: укажите FactoryID и адрес службы в настройках кассы');
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    throw err;
  }

  const upper = String(kind || '').toUpperCase();
  if (upper === 'X_REPORT' || upper === 'X') return null;

  try {
    if (upper === 'OPEN' || upper === 'OPEN_SHIFT') {
      await openZReport(baseUrl, factoryId);
      return { ok: true, kind: 'OPEN' };
    }
    if (upper === 'CLOSE' || upper === 'CLOSE_SHIFT') {
      await closeZReport(baseUrl, factoryId);
      return { ok: true, kind: 'CLOSE' };
    }
    return null;
  } catch (err) {
    throw mapFiscalDriveError(err);
  }
}

export function isFiscalDriveShiftAlreadyOpenError(err) {
  const msg = String(err?.message || err || '');
  return /0x9023|already.?open|уже.*(открыт|открыт)/i.test(msg);
}
