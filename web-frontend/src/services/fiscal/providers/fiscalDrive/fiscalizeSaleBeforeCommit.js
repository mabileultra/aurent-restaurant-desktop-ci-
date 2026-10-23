import { expandMarkedFiscalItems } from '../../shared/expandMarkedFiscalItems';
import {
  enrichFiscalPackageCodes,
  isRealFiscalPackageCode,
} from '../../shared/resolveFiscalPackageCodes';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { logFiscal } from '../../../desktop/activityLog';
import { buildFiscalDriveReceipt } from './buildFiscalDriveReceipt';
import { ensureFiscalDriveReady, openFiscalDriveZReport } from './ensureFiscalDriveReady';
import {
  FISCAL_DRIVE_DEFAULT_BASE_URL,
  getReceiptTxid,
  parseReceiptTxid,
  registerReceiptTxid,
  syncFiscalDriveState,
  syncFullReceipts,
} from './fiscalDriveHttpClient';
import {
  isFiscalDriveNeedsSyncError,
  isFiscalDriveZNotOpenError,
  mapFiscalDriveError,
} from './mapFiscalDriveError';
import { parseFiscalDriveRegisterResult, toFiscalDriveSalePayload } from './parseFiscalDriveResult';
import { validateFiscalDriveReceipt } from './validateFiscalDriveReceipt';
import { MARKING_VALIDATION_STATUS, validateFiscalMarking } from './validateFiscalMarking';

function pendingPayload({ txid, receipt, message }) {
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

function isFiscalDriveCaps(capabilities) {
  return (
    Boolean(capabilities?.enabled) ||
    String(capabilities?.fiscalProvider || '').toUpperCase() === 'FISCAL_DRIVE'
  );
}

async function assertMarkingOk({ capabilities, cartItems, offline, requireBeforeSale }) {
  try {
    const result = await validateFiscalMarking({
      cashRegisterId: capabilities.cashRegisterId,
      cartItems,
      refund: false,
    });
    if (!result || result.status === MARKING_VALIDATION_STATUS.NOT_REQUIRED) return;
    if (result.status === MARKING_VALIDATION_STATUS.VALID) return;
    if (result.status === MARKING_VALIDATION_STATUS.REJECTED) {
      const err = new Error(result.message || `Код маркировки отклонён (${result.code || '?'})`);
      err.code = 'FISCAL_DRIVE_MARKING_REJECTED';
      err.markingCode = result.code;
      throw err;
    }
    // UNAVAILABLE
    const err = new Error(result.message || 'Сервис проверки маркировки недоступен');
    err.code = 'FISCAL_DRIVE_MARKING_UNAVAILABLE';
    if (offline || !requireBeforeSale) {
      err.soft = true;
    }
    throw err;
  } catch (err) {
    if (err?.code?.startsWith('FISCAL_DRIVE_MARKING')) throw err;
    const wrapped = new Error(err?.message || 'Не удалось проверить маркировку');
    wrapped.code = 'FISCAL_DRIVE_MARKING_UNAVAILABLE';
    wrapped.cause = err;
    if (offline || !requireBeforeSale) wrapped.soft = true;
    throw wrapped;
  }
}

async function registerWithRetry({ baseUrl, factoryId, txid, attempts = 2 }) {
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
async function registerTxidReady({ baseUrl, factoryId, txid }) {
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

/**
 * Фискализация продажи через FiscalDrive (ФМ 0400) до commit продажи.
 * GetTXID → RegisterTXID (повтор при сбое связи). QR только из ответа RegisterTXID.
 * Для FiscalDrive продажа без FiscalSign не допускается (кроме offline).
 */
export async function fiscalizeSaleBeforeCommit({
  capabilities,
  cartItems,
  payment,
  total,
  offline = false,
}) {
  if (!isFiscalDriveCaps(capabilities)) return null;

  // FiscalDrive: QR с ofd.soliq.uz только после RegisterTXID — не наследуем soft-fail Multikassa.
  const requireBeforeSale = !offline;

  let factoryId;
  let baseUrl;
  let readyTerminalId = null;
  try {
    const ready = await ensureFiscalDriveReady({
      baseUrl: capabilities?.baseUrl || FISCAL_DRIVE_DEFAULT_BASE_URL,
      factoryId: capabilities?.factoryId,
    });
    factoryId = ready.factoryId;
    baseUrl = ready.baseUrl;
    readyTerminalId = ready.terminalId;
  } catch (err) {
    const mapped = mapFiscalDriveError(err);
    if (offline) {
      logFiscal('FiscalDrive отложен (нет ФМ)', { offline, message: mapped.message }, 'warn');
      return pendingPayload({ message: mapped.message });
    }
    throw mapped;
  }

  const fiscalItems = expandMarkedFiscalItems(await enrichFiscalPackageCodes(cartItems));
  const missingPackage = fiscalItems.find((line) => {
    const ikpu = String(line?.ikpu || '').trim();
    return ikpu && !isRealFiscalPackageCode(line?.packageCode);
  });
  if (missingPackage) {
    const err = new Error(
      `${missingPackage.name || 'Товар'}: нет кода упаковки Tasnif для ИКПУ ${missingPackage.ikpu}`,
    );
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    if (offline) return pendingPayload({ message: err.message });
    throw err;
  }

  try {
    await assertMarkingOk({ capabilities, cartItems: fiscalItems, offline, requireBeforeSale });
  } catch (err) {
    if (err?.soft) {
      logFiscal(`Маркировка UNAVAILABLE → PENDING: ${err.message}`, null, 'warn');
      return pendingPayload({ message: err.message });
    }
    throw err;
  }

  const receipt = buildFiscalDriveReceipt({
    cartItems: fiscalItems,
    payment,
    total,
    capabilities: { ...capabilities, factoryId, baseUrl, terminalId: capabilities?.terminalId || readyTerminalId },
  });
  const validationErrors = validateFiscalDriveReceipt(receipt);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors[0]);
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    err.details = validationErrors;
    if (offline) return pendingPayload({ receipt, message: err.message });
    throw err;
  }

  let txid = null;
  try {
    txid = parseReceiptTxid(await getReceiptTxid(baseUrl, factoryId, receipt));
    if (!txid) {
      const err = new Error('FiscalDrive не вернул TXID');
      err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
      throw err;
    }

    const registered = await registerTxidReady({ baseUrl, factoryId, txid });
    const parsed = parseFiscalDriveRegisterResult(registered, {
      terminalId: capabilities?.terminalId || readyTerminalId || null,
      datetime: receipt?.Time || null,
    });
    if (parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED) {
      if (offline) {
        return pendingPayload({ txid, receipt, message: parsed.fiscalError });
      }
      const err = new Error(parsed.fiscalError);
      err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
      throw err;
    }

    try {
      await syncFullReceipts(baseUrl, factoryId, 10);
    } catch (syncErr) {
      logFiscal(`FiscalDrive FullReceipts sync: ${syncErr?.message || syncErr}`, { txid }, 'warn');
    }

    const payload = toFiscalDriveSalePayload(parsed, { txid, receipt });
    logFiscal('FiscalDrive фискализация успешна', {
      fiscalSign: payload.fiscalSign,
      receiptSeq: payload.fiscalReceiptSeq,
      txid,
    });
    return payload;
  } catch (err) {
    const mapped = err?.code?.startsWith('FISCAL_DRIVE') ? err : mapFiscalDriveError(err);
    if (offline) {
      logFiscal(`FiscalDrive PENDING: ${mapped.message}`, { offline, txid }, 'warn');
      return pendingPayload({ txid, receipt, message: mapped.message });
    }
    logFiscal(`FiscalDrive ошибка: ${mapped.message}`, { txid }, 'error');
    throw mapped;
  }
}
