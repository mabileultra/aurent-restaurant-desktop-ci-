/**
 * REST FiscalDriveService (ФМ 0400). HTTP-методы и формы ответов сверить со swagger
 * (`/swagger/index.html`) на реальном модуле — парсеры ниже терпимы к регистру ключей.
 */
import { localDeviceHttpRequest } from '../../shared/localDeviceHttp';
import { normalizeReceiptTxid } from './fiscalDriveParsers';

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

function errorBlob(err) {
  return `${err?.message || ''} ${typeof err?.data === 'string' ? err.data : JSON.stringify(err?.data || {})}`;
}

function isEmptyTxidError(err) {
  return /invalid TXID|ParseUint:\s*parsing\s*""/i.test(errorBlob(err));
}

/** Form JsonReceipt не разобрался — служба парсит пустой Time/DateTime (HTTP 500). */
export function isEmptyFiscalDateTimeError(err) {
  return /invalid DateTime field value|cannot parse "" as "2006"|ParseError/i.test(errorBlob(err));
}

function shouldRetryGetTxidAsJson(err) {
  const status = Number(err?.status);
  if (status === 400 || status === 415 || status === 422) return true;
  return isEmptyFiscalDateTimeError(err);
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
    // Form не приняли / Time пришёл пустым — тот же чек сырым JSON, без второго GetTXID с другим телом-пустышкой.
    if (!shouldRetryGetTxidAsJson(err)) throw err;
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

export {
  normalizeReceiptTxid,
  parseReceiptTxid,
  parseFiscalDriveFactoryIds,
  summarizeFiscalDriveInfo,
} from './fiscalDriveParsers';
