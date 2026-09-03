import { buildSaleOperationBody } from './buildMultikassaOperations';
import { postOperation } from './multikassaHttpClient';
import {
  hasRealFiscalProof,
  parseMultikassaOperationResult,
  toSaleFiscalPayload,
} from './parseMultikassaResult';
import { FISCAL_STATUS } from './multikassaConstants';

function buildIdempotencyKey({ shiftId, clientSaleId }) {
  if (clientSaleId) return `sale:${clientSaleId}`;
  if (shiftId) return `sale:${shiftId}:${Date.now()}`;
  return `sale:${Date.now()}`;
}

function pendingPayload(body, idempotencyKey, message) {
  return {
    fiscalStatus: FISCAL_STATUS.PENDING,
    fiscalSign: null,
    fiscalReceiptSeq: null,
    multikassaSaleId: null,
    fiscalQrUrl: null,
    fiscalError: message || 'Pending fiscal sync',
    multikassaRetryBody: body,
    clientOperationId: idempotencyKey,
  };
}

function rejectIncompleteFiscal(parsed) {
  const err = new Error(
    parsed?.fiscalError ||
      'Multikassa не вернула фискальный признак. Чек не фискализирован — продажа отменена.',
  );
  err.code = 'MULTIKASSA_FISCAL_FAILED';
  err.data = parsed?.raw ?? null;
  throw err;
}

/**
 * Фискализация продажи на Multikassa (до commit в POS).
 * Без настоящего fiscalSign / saleId / QR — не помечаем как FISCALIZED (никаких MK-*).
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

    if (!hasRealFiscalProof(parsed) || parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED) {
      if (offline) {
        return pendingPayload(body, idempotencyKey, parsed.fiscalError);
      }
      if (capabilities.requireBeforeSale) {
        rejectIncompleteFiscal(parsed);
      }
      return pendingPayload(body, idempotencyKey, parsed.fiscalError);
    }

    return {
      ...toSaleFiscalPayload(parsed),
      multikassaRetryBody: body,
      clientOperationId: idempotencyKey,
    };
  } catch (err) {
    if (err?.code === 'MULTIKASSA_FISCAL_FAILED') {
      throw err;
    }
    if (offline) {
      return pendingPayload(body, idempotencyKey, err?.message);
    }
    if (capabilities.requireBeforeSale) {
      throw err;
    }
    return pendingPayload(body, idempotencyKey, err?.message);
  }
}
