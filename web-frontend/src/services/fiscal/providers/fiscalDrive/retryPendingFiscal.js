import { loadMultikassaCapabilities } from '../../../multikassa/loadMultikassaCapabilities';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { registerReceiptTxid } from './fiscalDriveHttpClient';
import { mapFiscalDriveError } from './mapFiscalDriveError';
import { parseFiscalDriveRegisterResult, toFiscalDriveSalePayload } from './parseFiscalDriveResult';

/**
 * Повтор RegisterTXID для отложенной продажи FiscalDrive.
 * Нужен payload.fiscal.fiscalDriveRetry.txid; baseUrl/factoryId — из capabilities кассы.
 */
export async function retryPendingFiscalOnPayload(payload, { storeId, cashRegisterId, capabilities: capsHint } = {}) {
  const fiscal = payload?.fiscal || payload;
  if (fiscal?.fiscalStatus && fiscal.fiscalStatus !== FISCAL_STATUS.PENDING) return payload;

  const retry = fiscal?.fiscalDriveRetry;
  const txid = retry?.txid || fiscal?.fiscalDriveTxid;
  if (!txid) return payload;

  const capabilities =
    capsHint ||
    (await loadMultikassaCapabilities(storeId ?? payload.storeId, cashRegisterId ?? payload.cashRegisterId));
  const factoryId = String(capabilities?.factoryId || '').trim();
  const baseUrl = String(capabilities?.baseUrl || '').trim();
  if (!capabilities?.enabled || !factoryId || !baseUrl) return payload;

  try {
    const registered = await registerReceiptTxid(baseUrl, factoryId, txid);
    const parsed = parseFiscalDriveRegisterResult(registered);
    if (parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED) return payload;
    const next = toFiscalDriveSalePayload(parsed, { txid, receipt: retry?.receipt });
    if (payload?.fiscal) {
      return { ...payload, fiscal: { ...payload.fiscal, ...next } };
    }
    return { ...payload, ...next };
  } catch (err) {
    const mapped = mapFiscalDriveError(err);
    if (payload?.fiscal) {
      return {
        ...payload,
        fiscal: { ...payload.fiscal, fiscalError: mapped.message, fiscalStatus: FISCAL_STATUS.PENDING },
      };
    }
    return { ...payload, fiscalError: mapped.message, fiscalStatus: FISCAL_STATUS.PENDING };
  }
}
