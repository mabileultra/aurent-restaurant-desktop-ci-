import { FISCAL_STATUS } from './multikassaConstants';
import { getOperations, postOperation } from './multikassaHttpClient';
import {
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

/**
 * POST /api/v1/operations, при отсутствии QR — GET /api/v1/operations.
 * QR собирается из QRCodeURL модуля или из t/r/c/s (ofd.soliq.uz/check).
 */
export async function runMultikassaOperation(baseUrl, body, hints = {}) {
  const raw = await postOperation(baseUrl, body);
  let parsed = parseMultikassaOperationResult(raw, hints);

  const needsQr = !parsed.fiscalQrUrl;
  const needsProof = !hasRealFiscalProof(parsed) || parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED;

  if (!isHardModuleError(parsed) && (needsQr || needsProof)) {
    try {
      const listRaw = await getOperations(baseUrl);
      parsed = mergeFiscalParse(parsed, parseMultikassaOperationsList(listRaw, hints), hints);
    } catch {
      /* GET опционален: облако/агент может не отдавать список */
    }
  }

  return parsed;
}
