import { FISCAL_STATUS } from '../../fiscalStatus';
import { openFiscalDriveZReport } from './ensureFiscalDriveReady';
import {
  registerReceiptTxid,
  syncFiscalDriveState,
} from './fiscalDriveHttpClient';
import {
  isFiscalDriveNeedsSyncError,
  isFiscalDriveZNotOpenError,
  mapFiscalDriveError,
} from './mapFiscalDriveError';

export function pendingPayload({ txid, receipt, message }) {
  return {
    fiscalStatus: FISCAL_STATUS.PENDING,
    fiscalSign: null,
    fiscalReceiptSeq: null,
    multikassaSaleId: null,
    fiscalQrUrl: null,
    fiscalError: message || 'Pending fiscal sync',
    fiscalTerminalId: null,
    fiscalProvider: 'FISCAL_DRIVE',
    fiscalDriveTxid: txid || null,
    fiscalDriveRetry: txid ? { txid, receipt } : { receipt },
  };
}

export function isFiscalDriveCaps(capabilities) {
  return (
    Boolean(capabilities?.enabled) ||
    String(capabilities?.fiscalProvider || '').toUpperCase() === 'FISCAL_DRIVE'
  );
}

export async function registerWithRetry({ baseUrl, factoryId, txid, attempts = 2 }) {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await registerReceiptTxid(baseUrl, factoryId, txid);
    } catch (err) {
      lastErr = err;
      const unreachable = err?.code === 'LOCAL_DEVICE_UNREACHABLE' || !err?.status;
      if (!unreachable || i === attempts - 1) throw err;
    }
  }
  throw lastErr;
}

/** RegisterTXID с тем же TXID: открыть Z / State/Sync и повторить, без повторного GetTXID. */
export async function registerTxidReady({ baseUrl, factoryId, txid }) {
  try {
    return await registerWithRetry({ baseUrl, factoryId, txid });
  } catch (err) {
    const mapped = mapFiscalDriveError(err);
    if (isFiscalDriveZNotOpenError(mapped)) {
      await openFiscalDriveZReport(baseUrl, factoryId);
      return registerWithRetry({ baseUrl, factoryId, txid });
    }
    if (isFiscalDriveNeedsSyncError(mapped)) {
      await syncFiscalDriveState(baseUrl, factoryId);
      await openFiscalDriveZReport(baseUrl, factoryId);
      return registerWithRetry({ baseUrl, factoryId, txid });
    }
    throw mapped;
  }
}
