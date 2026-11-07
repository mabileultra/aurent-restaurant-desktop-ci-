import { normalizeGnkTerminalId } from './buildMultikassaOperations';
import { FISCAL_STATUS } from './multikassaConstants';

export function buildIdempotencyKey({ shiftId, clientSaleId }) {
  if (clientSaleId) return `sale:${clientSaleId}`;
  if (shiftId) return `sale:${shiftId}:${Date.now()}`;
  return `sale:${Date.now()}`;
}

export function pendingPayload(body, idempotencyKey, message) {
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

export function rejectIncompleteFiscal(parsed) {
  const err = new Error(
    parsed?.fiscalError ||
      'Multikassa не вернула фискальный признак. Чек не фискализирован — продажа отменена.',
  );
  err.code = 'MULTIKASSA_FISCAL_FAILED';
  err.data = parsed?.raw ?? null;
  throw err;
}

export function assertCapabilitiesReady(capabilities) {
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
