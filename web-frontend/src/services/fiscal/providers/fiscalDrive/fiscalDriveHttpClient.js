/**
 * REST FiscalDriveService (ФМ 0400). HTTP-методы и формы ответов сверить со swagger
 * (`/swagger/index.html`) на реальном модуле — парсеры ниже терпимы к регистру ключей.
 */
import { localDeviceHttpRequest } from '../../shared/localDeviceHttp';

export const FISCAL_DRIVE_DEFAULT_BASE_URL = 'http://127.0.0.1:3449';

export function listFiscalDrives(baseUrl) {
  return localDeviceHttpRequest({ baseUrl, method: 'GET', path: '/FiscalDrive/List' });
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

function unwrapArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of ['FiscalDrives', 'fiscalDrives', 'List', 'list', 'Data', 'data', 'Items', 'items']) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  return [];
}

/** Ответ `/FiscalDrive/List` → уникальные FactoryID. */
export function parseFiscalDriveFactoryIds(raw) {
  const ids = unwrapArray(raw)
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : pick(entry, 'FactoryID', 'FactoryId', 'factoryId', 'factoryID', 'ID', 'Id', 'id'),
    )
    .map((id) => (id == null ? '' : String(id).trim()))
    .filter(Boolean);
  return [...new Set(ids)];
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
