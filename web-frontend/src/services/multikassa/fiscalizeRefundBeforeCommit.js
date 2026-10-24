import { buildRefundBody } from './buildMultikassaOperations';
import { runMultikassaOperation } from './runMultikassaOperation';
import { assertOnkmMarking } from '../fiscal/shared/assertOnkmMarking';

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

  await assertOnkmMarking({
    cashRegisterId: capabilities.cashRegisterId,
    cartItems: sale?.items || sale?.saleItems || [],
    refund: true,
    requireBeforeSale: true,
    errorPrefix: 'MULTIKASSA',
  });

  const body = buildRefundBody({ receiptSaleId });
  return runMultikassaOperation(capabilities.baseUrl, body, {
    terminalId: capabilities.terminalId,
  });
}
