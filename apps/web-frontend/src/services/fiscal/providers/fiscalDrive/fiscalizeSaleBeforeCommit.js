import { expandMarkedFiscalItems } from '../../shared/expandMarkedFiscalItems';
import {
  enrichFiscalPackageCodes,
  isRealFiscalPackageCode,
} from '../../shared/resolveFiscalPackageCodes';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { logFiscal } from '../../../desktop/activityLog';
import { buildFiscalDriveReceipt } from './buildFiscalDriveReceipt';
import { ensureFiscalDriveReady } from './ensureFiscalDriveReady';
import {
  FISCAL_DRIVE_DEFAULT_BASE_URL,
  getReceiptTxid,
  parseReceiptTxid,
  syncFullReceipts,
} from './fiscalDriveHttpClient';
import { mapFiscalDriveError } from './mapFiscalDriveError';
import { parseFiscalDriveRegisterResult, toFiscalDriveSalePayload } from './parseFiscalDriveResult';
import { validateFiscalDriveReceipt } from './validateFiscalDriveReceipt';
import { assertOnkmMarking } from '../../../../features/marking/onkm';
import {
  pendingPayload,
  isFiscalDriveCaps,
  registerTxidReady,
} from './fiscalizeSaleHelpers';

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
  // «Fiskal QR» off = без ОФД / Labels / вывода КМ — только обычный чек.
  if (capabilities.printFiscalQr === false) {
    logFiscal('FiscalDrive пропущен: printFiscalQr=false', null, 'info');
    return null;
  }

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
    await assertOnkmMarking({
      cashRegisterId: capabilities.cashRegisterId,
      cartItems: fiscalItems,
      offline,
      requireBeforeSale,
      errorPrefix: 'FISCAL_DRIVE',
    });
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
