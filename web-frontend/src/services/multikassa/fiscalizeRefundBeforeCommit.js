import { buildRefundBody } from './buildMultikassaOperations';
import { postOperation } from './multikassaHttpClient';
import { parseMultikassaOperationResult } from './parseMultikassaResult';

/**
 * Возврат в Multikassa (op 4) до partial return в POS.
 * Без multikassaSaleId на исходном чеке — пропускаем (legacy / не фискализирован).
 */
export async function fiscalizeRefundBeforeCommit({
  capabilities,
  sale,
  offline = false,
}) {
  if (!capabilities?.enabled) {
    return null;
  }

  const receiptSaleId = sale?.multikassaSaleId;
  if (!receiptSaleId) {
    return { skipped: true, reason: 'NO_MULTIKASSA_SALE_ID' };
  }

  if (offline) {
    const err = new Error('MULTIKASSA_OFFLINE_BLOCKED');
    err.code = 'MULTIKASSA_OFFLINE_BLOCKED';
    throw err;
  }

  const body = buildRefundBody({ receiptSaleId });
  const raw = await postOperation(capabilities.baseUrl, body);
  return parseMultikassaOperationResult(raw);
}
