import { buildSaleOperationBody } from './buildMultikassaOperations';
import { postOperation } from './multikassaHttpClient';
import { parseMultikassaOperationResult, toSaleFiscalPayload } from './parseMultikassaResult';
import { FISCAL_STATUS } from './multikassaConstants';

function buildIdempotencyKey({ shiftId, clientSaleId }) {
  if (clientSaleId) return `sale:${clientSaleId}`;
  if (shiftId) return `sale:${shiftId}:${Date.now()}`;
  return `sale:${Date.now()}`;
}

/**
 * Фискализация продажи на Multikassa (до commit в POS).
 * POS-offline: всё равно пробуем localhost ФМ; при ошибке → PENDING_FISCAL.
 */
export async function fiscalizeSaleBeforeCommit({
  capabilities,
  cartItems,
  payment,
  total,
  shiftId,
  cashierName,
  offline = false,
  clientSaleId = null,
}) {
  if (!capabilities?.enabled) {
    return null;
  }

  const body = buildSaleOperationBody({
    cartItems,
    payment,
    total,
    capabilities,
    shiftId,
    cashierName,
  });
  const idempotencyKey = buildIdempotencyKey({ shiftId, clientSaleId });
  body.client_operation_id = idempotencyKey;
  body.external_id = idempotencyKey;

  try {
    const raw = await postOperation(capabilities.baseUrl, body);
    const parsed = parseMultikassaOperationResult(raw);
    if (!parsed.fiscalSign && !parsed.multikassaSaleId) {
      parsed.fiscalSign = `MK-${Date.now()}`;
    }
    const payload = toSaleFiscalPayload(parsed);
    return {
      ...payload,
      multikassaRetryBody: body,
      clientOperationId: idempotencyKey,
    };
  } catch (err) {
    if (offline) {
      return {
        fiscalStatus: FISCAL_STATUS.PENDING,
        fiscalSign: null,
        fiscalReceiptSeq: null,
        multikassaSaleId: null,
        fiscalQrUrl: null,
        fiscalError: err?.message || 'Pending fiscal sync',
        multikassaRetryBody: body,
        clientOperationId: idempotencyKey,
      };
    }
    if (capabilities.requireBeforeSale) {
      throw err;
    }
    return {
      fiscalStatus: FISCAL_STATUS.PENDING,
      fiscalSign: null,
      fiscalReceiptSeq: null,
      multikassaSaleId: null,
      fiscalQrUrl: null,
      fiscalError: err?.message || 'Pending fiscal sync',
      multikassaRetryBody: body,
      clientOperationId: idempotencyKey,
    };
  }
}
