import { FISCAL_STATUS } from './multikassaConstants';
import { postOperation } from './multikassaHttpClient';
import { parseMultikassaOperationResult, toSaleFiscalPayload } from './parseMultikassaResult';
import { loadMultikassaCapabilities } from './loadMultikassaCapabilities';

/**
 * Дожим PENDING_FISCAL перед sync: повторный POST operations по сохранённому body.
 */
export async function retryPendingFiscalOnPayload(payload, { storeId, cashRegisterId } = {}) {
  const fiscal = payload?.fiscal;
  if (!fiscal || fiscal.fiscalStatus !== FISCAL_STATUS.PENDING) {
    return payload;
  }
  const retryBody = fiscal.multikassaRetryBody || payload.multikassaRetryBody;
  if (!retryBody) {
    return payload;
  }

  const capabilities = await loadMultikassaCapabilities(storeId ?? payload.storeId, cashRegisterId);
  if (!capabilities?.enabled) {
    return payload;
  }

  try {
    const raw = await postOperation(capabilities.baseUrl, retryBody);
    const parsed = parseMultikassaOperationResult(raw);
    if (!parsed.fiscalSign && !parsed.multikassaSaleId) {
      parsed.fiscalSign = `MK-${Date.now()}`;
    }
    const nextFiscal = {
      ...toSaleFiscalPayload(parsed),
      multikassaRetryBody: retryBody,
      clientOperationId: fiscal.clientOperationId || retryBody.client_operation_id || null,
    };
    return {
      ...payload,
      fiscal: nextFiscal,
    };
  } catch {
    return payload;
  }
}
