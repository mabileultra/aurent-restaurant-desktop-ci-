import { buildSaleOperationBody } from './buildMultikassaOperations';
import { runMultikassaOperation } from './runMultikassaOperation';
import {
  ensureFiscalQrUrl,
  hasRealFiscalProof,
  toSaleFiscalPayload,
} from './parseMultikassaResult';
import { FISCAL_STATUS } from './multikassaConstants';
import { isOfdCheckUrl } from '../../utils/ofdQrUrl';

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
  const terminalId = String(capabilities.terminalId || '').trim();
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
 * Онлайн + Multikassa enabled → всегда жёстко требуем фискал+QR.
 * Soft PENDING только для offline (дожим при sync).
 */
function mustHardRequireFiscal(capabilities, offline) {
  return Boolean(capabilities?.enabled) && !offline;
}

/**
 * Фискализация продажи на Multikassa (до commit в POS).
 * POST $BASE_URL/api/v1/operations — как в доке Multikassa Operations API.
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

  const hardRequire = mustHardRequireFiscal(capabilities, offline);

  try {
    assertCapabilitiesReady(capabilities);
  } catch (err) {
    if (offline) {
      return pendingPayload(null, buildIdempotencyKey({ shiftId, clientSaleId }), err.message);
    }
    if (hardRequire || capabilities.requireBeforeSale) throw err;
    return pendingPayload(null, buildIdempotencyKey({ shiftId, clientSaleId }), err.message);
  }

  const body = buildSaleOperationBody({
    cartItems,
    payment,
    total,
    capabilities,
    shiftId,
    cashierName,
    contractorName,
  });
  const idempotencyKey = buildIdempotencyKey({ shiftId, clientSaleId });
  // Идемпотентность для повторных попыток (модуль игнорирует неизвестные поля).
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
      if (offline) {
        return pendingPayload(body, idempotencyKey, parsed.fiscalError);
      }
      if (hardRequire || capabilities.requireBeforeSale) {
        rejectIncompleteFiscal(parsed);
      }
      return pendingPayload(body, idempotencyKey, parsed.fiscalError);
    }

    if (!hasQr && (hardRequire || capabilities.requireBeforeSale)) {
      const err = new Error(
        'Фискальный признак получен, но QR-код ГНК не сформирован. Проверьте Terminal ID, номер чека в ответе модуля и смену ФМ.',
      );
      err.code = 'MULTIKASSA_FISCAL_FAILED';
      err.data = parsed?.raw ?? null;
      throw err;
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
    if (hardRequire || capabilities.requireBeforeSale) {
      const wrapped = err;
      if (!wrapped.code) wrapped.code = 'MULTIKASSA_FISCAL_FAILED';
      throw wrapped;
    }
    return pendingPayload(body, idempotencyKey, err?.message);
  }
}
