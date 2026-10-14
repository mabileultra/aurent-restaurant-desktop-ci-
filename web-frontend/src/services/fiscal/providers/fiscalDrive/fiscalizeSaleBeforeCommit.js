import { expandMarkedFiscalItems } from '../../shared/expandMarkedFiscalItems';
import {
  enrichFiscalPackageCodes,
  isRealFiscalPackageCode,
} from '../../shared/resolveFiscalPackageCodes';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { logFiscal } from '../../../desktop/activityLog';
import { buildFiscalDriveReceipt } from './buildFiscalDriveReceipt';
import {
  getReceiptTxid,
  parseReceiptTxid,
  registerReceiptTxid,
} from './fiscalDriveHttpClient';
import { mapFiscalDriveError } from './mapFiscalDriveError';
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

function assertCapabilitiesReady(capabilities) {
  const factoryId = String(capabilities?.factoryId || '').trim();
  const baseUrl = String(capabilities?.baseUrl || '').trim();
  if (!factoryId) {
    const err = new Error('В настройках FiscalDrive не указан FactoryID модуля');
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    throw err;
  }
  if (!baseUrl) {
    const err = new Error('Не указан адрес FiscalDriveService (обычно http://127.0.0.1:3449)');
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    throw err;
  }
  return { factoryId, baseUrl };
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

/**
 * Фискализация продажи через FiscalDrive (ФМ 0400) до commit продажи.
 * GetTXID → RegisterTXID (повтор при сбое связи). TXID сохраняется для pending retry.
 */
export async function fiscalizeSaleBeforeCommit({
  capabilities,
  cartItems,
  payment,
  total,
  offline = false,
}) {
  if (!capabilities?.enabled) return null;

  const requireBeforeSale = Boolean(capabilities.requireBeforeSale);

  let factoryId;
  let baseUrl;
  try {
    ({ factoryId, baseUrl } = assertCapabilitiesReady(capabilities));
  } catch (err) {
    if (offline || !requireBeforeSale) {
      logFiscal('FiscalDrive отложен (нет настроек)', { offline, message: err.message }, 'warn');
      return pendingPayload({ message: err.message });
    }
    throw err;
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
    if (offline || !requireBeforeSale) return pendingPayload({ message: err.message });
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
    capabilities,
  });
  const validationErrors = validateFiscalDriveReceipt(receipt);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors[0]);
    err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
    err.details = validationErrors;
    if (offline || !requireBeforeSale) return pendingPayload({ receipt, message: err.message });
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

    const registered = await registerWithRetry({ baseUrl, factoryId, txid });
    const parsed = parseFiscalDriveRegisterResult(registered, {
      terminalId: capabilities?.terminalId || null,
      datetime: receipt?.Time || null,
    });
    if (parsed.fiscalStatus !== FISCAL_STATUS.FISCALIZED) {
      if (offline || !requireBeforeSale) {
        return pendingPayload({ txid, receipt, message: parsed.fiscalError });
      }
      const err = new Error(parsed.fiscalError);
      err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
      throw err;
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
    if (offline || !requireBeforeSale) {
      logFiscal(`FiscalDrive PENDING: ${mapped.message}`, { offline, txid }, 'warn');
      return pendingPayload({ txid, receipt, message: mapped.message });
    }
    logFiscal(`FiscalDrive ошибка: ${mapped.message}`, { txid }, 'error');
    throw mapped;
  }
}
