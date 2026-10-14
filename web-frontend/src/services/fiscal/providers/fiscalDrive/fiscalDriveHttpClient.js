/**
 * REST FiscalDriveService (ФМ 0400). HTTP-методы и формы ответов сверить со swagger
 * (`/swagger/index.html`) на реальном модуле — парсеры ниже терпимы к регистру ключей.
 */
import { localDeviceHttpRequest } from '../../shared/localDeviceHttp';

export const FISCAL_DRIVE_DEFAULT_BASE_URL = 'http://127.0.0.1:3449';

/** Список ФМ. В swagger метод бывает GET или POST — пробуем оба. */
export async function listFiscalDrives(baseUrl) {
  try {
    return await localDeviceHttpRequest({ baseUrl, method: 'GET', path: '/FiscalDrive/List' });
  } catch (err) {
    const status = Number(err?.status);
    const retryPost = !status || status === 400 || status === 404 || status === 405 || status === 415;
    if (!retryPost) throw err;
    return localDeviceHttpRequest({ baseUrl, method: 'POST', path: '/FiscalDrive/List', body: {} });
  }
}

export function getFiscalDriveInfo(baseUrl, factoryId) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'GET',
    path: `/FiscalDrive/Info/${encodeURIComponent(String(factoryId || '').trim())}`,
  });
}

function factoryPath(factoryId, suffix) {
  return `/FiscalDrive/${suffix}/${encodeURIComponent(String(factoryId || '').trim())}`;
}

/** JSON-чек → TXID в БД FiscalDriveService. */
export function getReceiptTxid(baseUrl, factoryId, receipt) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: factoryPath(factoryId, 'Receipt/GetTXID'),
    body: receipt,
  });
}

/** Регистрация чека по TXID (идемпотентно при повторе). */
export function registerReceiptTxid(baseUrl, factoryId, txid) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: factoryPath(factoryId, 'Receipt/RegisterTXID'),
    body: { TXID: txid },
  });
}

export function openZReport(baseUrl, factoryId) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: factoryPath(factoryId, 'ZReport/Open'),
  });
}

export function closeZReport(baseUrl, factoryId) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: factoryPath(factoryId, 'ZReport/Close'),
  });
}

/** Ответ GetTXID: число, строка или объект с TXID. */
export function parseReceiptTxid(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number' || typeof raw === 'string') {
    const value = String(raw).trim();
    return value || null;
  }
  if (typeof raw === 'object') {
    const value = pick(raw, 'TXID', 'Txid', 'txid', 'Id', 'id');
    return value == null ? null : String(value).trim() || null;
  }
  return null;
}

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return null;
}

/** Рекурсивно собирает FactoryID из ответа List (массив, обёртки, вложенные объекты). */
function collectFactoryIds(raw, depth = 0, out = []) {
  if (raw == null || depth > 6) return out;
  if (typeof raw === 'string') {
    const id = raw.trim();
    // FactoryID в доке — 36 символов; допускаем чуть короче на всякий случай.
    if (id.length >= 20) out.push(id);
    return out;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    out.push(String(raw));
    return out;
  }
  if (Array.isArray(raw)) {
    for (const entry of raw) collectFactoryIds(entry, depth + 1, out);
    return out;
  }
  if (typeof raw === 'object') {
    const id = pick(raw, 'FactoryID', 'FactoryId', 'factoryId', 'factoryID');
    if (id != null) {
      const trimmed = String(id).trim();
      if (trimmed) out.push(trimmed);
    }
    for (const value of Object.values(raw)) {
      if (value && (typeof value === 'object' || typeof value === 'string')) {
        collectFactoryIds(value, depth + 1, out);
      }
    }
  }
  return out;
}

/** Ответ `/FiscalDrive/List` → уникальные FactoryID. */
export function parseFiscalDriveFactoryIds(raw) {
  return [...new Set(collectFactoryIds(raw))];
}

/** Ответ `/FiscalDrive/Info/{FactoryID}` → поля, которые нужны настройкам кассы. */
export function summarizeFiscalDriveInfo(raw) {
  const info = raw && typeof raw === 'object' ? raw : {};
  const terminalId = pick(info, 'TerminalID', 'TerminalId', 'terminalId', 'terminalID');
  const version = pick(info, 'AppletVersion', 'Version', 'version', 'appletVersion');
  return {
    terminalId: terminalId != null ? String(terminalId).trim().toUpperCase() : null,
    version: version != null ? String(version) : null,
  };
}
