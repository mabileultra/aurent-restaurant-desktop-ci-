import { buildSaleOperationBody, normalizeGnkTerminalId } from './buildMultikassaOperations';
import { expandMarkedFiscalItems } from '../fiscal/shared/expandMarkedFiscalItems';
import {
  enrichFiscalPackageCodes,
  isRealFiscalPackageCode,
} from '../fiscal/shared/resolveFiscalPackageCodes';
import { runMultikassaOperation } from './runMultikassaOperation';
import {
  ensureFiscalQrUrl,
  hasRealFiscalProof,
  toSaleFiscalPayload,
} from './parseMultikassaResult';
import { FISCAL_STATUS } from './multikassaConstants';
import { isOfdCheckUrl } from '../../utils/ofdQrUrl';
import { logFiscal } from '../desktop/activityLog';
import { assertOnkmMarking } from '../fiscal/shared/assertOnkmMarking';

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
    fiscalTerminalId: null,
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

function assertCapabilitiesReady(capabilities) {
  if (!capabilities?.enabled) return;
  const terminalId = normalizeGnkTerminalId(capabilities.terminalId);
  if (!terminalId) {
    const err = new Error(
      'В настройках Multikassa не указан Terminal ID. Укажите ID терминала ФМ и выберите fiscal drive.',
    );
    err.code = 'MULTIKASSA_FISCAL_FAILED';
    throw err;
  }
  const baseUrl = String(capabilities.baseUrl || '').trim();
  if (!baseUrl) {
    const err = new Error('Не указан base URL Multikassa (localhost:8080 / v3.mkfiscal.uz).');
    err.code = 'MULTIKASSA_FISCAL_FAILED';
    throw err;
  }
}

/**
 * Фискализация до commit.
 * - offline / нет связи → PENDING, продажа и обычный чек без QR.
 * - requireBeforeSale=true → жёстко блокируем продажу без фискала/QR.
 * - requireBeforeSale=false → soft-fail, чек без QR.
 */
export async function fiscalizeSaleBeforeCommit({
  capabilities,
  cartItems,
  payment,
  total,
  shiftId,
  cashierName,
  contractorName,
  offline = false,
  clientSaleId = null,
}) {
  if (!capabilities?.enabled) {
    return null;
  }

  const requireBeforeSale = Boolean(capabilities.requireBeforeSale);

  try {
    assertCapabilitiesReady(capabilities);
  } catch (err) {
    if (offline || !requireBeforeSale) {
      logFiscal('Фискализация отложена (нет настроек Multikassa)', { offline, message: err.message }, 'warn');
      return pendingPayload(null, buildIdempotencyKey({ shiftId, clientSaleId }), err.message);
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
      `${missingPackage.name || 'Товар'}: нет кода упаковки Tasnif для ИКПУ ${missingPackage.ikpu}. Код «1» фискальный модуль не принимает — укажите упаковку в карточке товара.`
    );
    err.code = 'MULTIKASSA_FISCAL_FAILED';
    if (offline || !requireBeforeSale) {
      return pendingPayload(null, buildIdempotencyKey({ shiftId, clientSaleId }), err.message);
    }
    throw err;
  }

  try {
    await assertOnkmMarking({
      cashRegisterId: capabilities.cashRegisterId,
      cartItems: fiscalItems,
      offline,
      requireBeforeSale,
      errorPrefix: 'MULTIKASSA',
    });
  } catch (err) {
    if (err?.soft) {
      logFiscal(`Маркировка UNAVAILABLE → PENDING: ${err.message}`, null, 'warn');
      return pendingPayload(null, buildIdempotencyKey({ shiftId, clientSaleId }), err.message);
    }
    throw err;
  }

  const body = buildSaleOperationBody({
    cartItems: fiscalItems,
    payment,
    total,
    capabilities,
    shiftId,
    cashierName,
    contractorName,
  });
  const idempotencyKey = buildIdempotencyKey({ shiftId, clientSaleId });
  body.client_operation_id = idempotencyKey;
  body.external_id = idempotencyKey;

  const hints = {
    terminalId: capabilities.terminalId || body.receipt_gnk_terminalid,
    datetime: body.receipt_gnk_time,
    receiptTime: body.receipt_gnk_time,
  };

  try {
    let parsed = await runMultikassaOperation(capabilities.baseUrl, body, hints);
    parsed = ensureFiscalQrUrl(parsed, hints);

    const hasProof = hasRealFiscalProof(parsed) && parsed.fiscalStatus === FISCAL_STATUS.FISCALIZED;
    const hasQr = Boolean(
      parsed.fiscalQrUrl &&
        (isOfdCheckUrl(parsed.fiscalQrUrl) || /^https?:\/\//i.test(parsed.fiscalQrUrl)),
    );

    if (!hasProof) {
      if (offline || !requireBeforeSale) {
        logFiscal('Фискализация PENDING', { offline, error: parsed.fiscalError }, 'warn');
        return pendingPayload(body, idempotencyKey, parsed.fiscalError);
      }
      rejectIncompleteFiscal(parsed);
    }

    if (!hasQr && requireBeforeSale && !offline) {
      // Признак есть, QR URL не собрался — продажу не рвём (иначе чек не печатается).
      const payload = {
        ...toSaleFiscalPayload(parsed),
        multikassaRetryBody: body,
        clientOperationId: idempotencyKey,
      };
      logFiscal('Фискализировано без QR URL', {
        fiscalSign: payload.fiscalSign,
        receiptSeq: payload.fiscalReceiptSeq,
      }, 'warn');
      return payload;
    }

    const payload = {
      ...toSaleFiscalPayload(parsed),
      multikassaRetryBody: body,
      clientOperationId: idempotencyKey,
    };
    logFiscal('Фискализация успешна', {
      fiscalSign: payload.fiscalSign,
      receiptSeq: payload.fiscalReceiptSeq,
      offline,
    });
    return payload;
  } catch (err) {
    if (err?.code === 'MULTIKASSA_FISCAL_FAILED' && requireBeforeSale && !offline) {
      logFiscal(`Фискализация отклонена: ${err.message}`, null, 'error');
      throw err;
    }
    if (offline || !requireBeforeSale) {
      logFiscal(`Фискализация PENDING после ошибки: ${err?.message || err}`, { offline }, 'warn');
      return pendingPayload(body, idempotencyKey, err?.message);
    }
    const wrapped = err;
    if (!wrapped.code) wrapped.code = 'MULTIKASSA_FISCAL_FAILED';
    logFiscal(`Фискализация ошибка: ${wrapped.message}`, null, 'error');
    throw wrapped;
  }
}
