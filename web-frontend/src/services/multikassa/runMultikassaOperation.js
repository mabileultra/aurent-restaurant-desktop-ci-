import { FISCAL_STATUS } from './multikassaConstants';
import { getOperations, postOperation } from './multikassaHttpClient';
import {
  ensureFiscalQrUrl,
  hasRealFiscalProof,
  mergeFiscalParse,
  parseMultikassaOperationResult,
  parseMultikassaOperationsList,
} from './parseMultikassaResult';

function isHardModuleError(parsed) {
  const err = String(parsed?.fiscalError || '');
  if (parsed?.fiscalStatus !== FISCAL_STATUS.FAILED) return false;
  if (!err) return false;
  return /error code/i.test(err) || /operation failed/i.test(err);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichFromOperationsList(baseUrl, parsed, hints) {
  let next = parsed;
  // Модуль иногда пишет фискальные поля с задержкой.
  for (const delayMs of [0, 400, 1000]) {
    if (delayMs) await sleep(delayMs);
    try {
      const listRaw = await getOperations(baseUrl);
      next = mergeFiscalParse(next, parseMultikassaOperationsList(listRaw, hints), hints);
      if (next.fiscalQrUrl && hasRealFiscalProof(next)) break;
    } catch {
      break;
    }
  }
  return ensureFiscalQrUrl(next, hints);
}

/**
 * POST /api/v1/operations, при отсутствии QR — GET /api/v1/operations.
 * QR: QRCodeURL модуля или официальный ofd.soliq.uz/check?t&r&c&s.
 */
export async function runMultikassaOperation(baseUrl, body, hints = {}) {
  const raw = await postOperation(baseUrl, body);
  let parsed = ensureFiscalQrUrl(parseMultikassaOperationResult(raw, hints), hints);

  const needsQr = !parsed.fiscalQrUrl;
  const needsProof = !hasRealFiscalProof(parsed) || parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED;

  if (!isHardModuleError(parsed) && (needsQr || needsProof)) {
    parsed = await enrichFromOperationsList(baseUrl, parsed, hints);
  } else if (!parsed.fiscalQrUrl) {
    parsed = ensureFiscalQrUrl(parsed, hints);
  }

  return parsed;
}
