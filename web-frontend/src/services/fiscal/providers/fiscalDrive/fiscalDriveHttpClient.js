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

const FORM_URLENCODED = { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' };

function isEmptyTxidError(err) {
  const text = `${err?.message || ''} ${typeof err?.data === 'string' ? err.data : JSON.stringify(err?.data || {})}`;
  return /invalid TXID|ParseUint:\s*parsing\s*""/i.test(text);
}

/** Нормализуем TXID к десятичной строке (как ждёт swagger form-поле). */
export function normalizeReceiptTxid(txid) {
  if (txid == null) return null;
  const raw = String(txid).trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  return raw;
}

/** JSON-чек → TXID в БД FiscalDriveService. Swagger: form-поле JsonReceipt. */
export async function getReceiptTxid(baseUrl, factoryId, receipt) {
  const path = factoryPath(factoryId, 'Receipt/GetTXID');
  const json = JSON.stringify(receipt);
  try {
    return await localDeviceHttpRequest({
      baseUrl,
      method: 'POST',
      path,
      body: new URLSearchParams({ JsonReceipt: json }).toString(),
      headers: FORM_URLENCODED,
    });
  } catch (err) {
    // Старые сборки принимают сырой JSON-чек в body.
    if (err?.status && err.status !== 400 && err.status !== 415) throw err;
    return localDeviceHttpRequest({
      baseUrl,
      method: 'POST',
      path,
      body: receipt,
    });
  }
}

/**
 * Регистрация чека по TXID (идемпотентно при повторе).
 * Swagger UI: отдельное поле TXID → form-urlencoded; JSON {TXID} — fallback.
 */
export async function registerReceiptTxid(baseUrl, factoryId, txid) {
  const value = normalizeReceiptTxid(txid);
  if (!value) {
    const err = new Error('FiscalDrive: пустой TXID для RegisterTXID');
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    throw err;
  }
  const path = factoryPath(factoryId, 'Receipt/RegisterTXID');
  try {
    return await localDeviceHttpRequest({
      baseUrl,
      method: 'POST',
      path,
      body: new URLSearchParams({ TXID: value }).toString(),
      headers: FORM_URLENCODED,
    });
  } catch (err) {
    if (!isEmptyTxidError(err) && Number(err?.status) !== 415) throw err;
    try {
      return await localDeviceHttpRequest({
        baseUrl,
        method: 'POST',
        path,
        body: { TXID: Number(value) },
      });
    } catch (jsonErr) {
      if (!isEmptyTxidError(jsonErr) && Number(jsonErr?.status) !== 415) throw jsonErr;
      return localDeviceHttpRequest({
        baseUrl,
        method: 'POST',
        path,
        body: value,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }
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

/** Синхронизация состояния ФМ с ОФД (время, разблокировка). */
export function syncFiscalDriveState(baseUrl, factoryId) {
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: factoryPath(factoryId, 'State/Sync'),
  });
}

/** Отправка FullReceipt из БД службы на ОФД (не нужна для QR на чеке). */
export function syncFullReceipts(baseUrl, factoryId, itemsCount = 10) {
  const count = Math.min(32, Math.max(1, Number(itemsCount) || 10));
  return localDeviceHttpRequest({
    baseUrl,
    method: 'POST',
    path: `/DataBase/Files/Sync/FullReceipts/${encodeURIComponent(String(factoryId || '').trim())}`,
    body: new URLSearchParams({ ItemsCount: String(count) }).toString(),
    headers: FORM_URLENCODED,
  });
}

function pickCI(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  const map = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = map.get(String(key).toLowerCase());
    if (real == null) continue;
    const value = obj[real];
    if (value != null && value !== '') return value;
  }
  return null;
}

function unwrapTxidPayload(raw, depth = 0) {
  if (raw == null || depth > 4) return raw;
  if (typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const direct = pickCI(raw, 'TXID', 'Txid', 'txid');
  if (direct != null) return raw;
  for (const key of ['result', 'data', 'payload', 'response', 'value', 'body', 'content']) {
    const inner = pickCI(raw, key);
    if (inner == null) continue;
    if (typeof inner === 'number' || typeof inner === 'string') return inner;
    if (typeof inner === 'object') return unwrapTxidPayload(inner, depth + 1);
  }
  return raw;
}

/** Ответ GetTXID: число, строка или объект с TXID. */
export function parseReceiptTxid(raw) {
  const unwrapped = unwrapTxidPayload(raw);
  if (unwrapped == null) return null;
  if (typeof unwrapped === 'number' || typeof unwrapped === 'string') {
    return normalizeReceiptTxid(unwrapped);
  }
  if (typeof unwrapped === 'object') {
    const value = pickCI(unwrapped, 'TXID', 'Txid', 'txid', 'Id', 'id');
    return normalizeReceiptTxid(value);
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
  const locked = pick(info, 'Locked', 'locked');
  return {
    terminalId: terminalId != null ? String(terminalId).trim().toUpperCase() : null,
    version: version != null ? String(version) : null,
    locked: locked === true || locked === 'true' || locked === 1,
  };
}
