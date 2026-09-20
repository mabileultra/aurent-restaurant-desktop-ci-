import { FISCAL_STATUS } from './multikassaConstants';
import { runMultikassaOperation } from './runMultikassaOperation';
import { hasRealFiscalProof, toSaleFiscalPayload } from './parseMultikassaResult';
import { loadMultikassaCapabilities } from './loadMultikassaCapabilities';

/**
 * Дожим PENDING_FISCAL перед sync: повторный POST operations по сохранённому body.
 * Без реального признака — оставляем PENDING (не подставляем MK-*).
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
    const parsed = await runMultikassaOperation(capabilities.baseUrl, retryBody, {
      terminalId: capabilities.terminalId || retryBody.receipt_gnk_terminalid,
      datetime: retryBody.receipt_gnk_time,
    });
    if (!hasRealFiscalProof(parsed) || parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED) {
      return {
        ...payload,
        fiscal: {
          ...fiscal,
          fiscalError: parsed.fiscalError || fiscal.fiscalError,
        },
      };
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
