import { MARKING_VALIDATION_STATUS } from './status';
import { validateFiscalMarking } from './validate';

export { MARKING_VALIDATION_STATUS };

/**
 * Перед чеком ФМ.
 * REJECTED — блок. UNAVAILABLE — soft, чек не стопим. VALID — не стопим.
 */
export async function assertOnkmMarking({
  cashRegisterId,
  cartItems,
  refund = false,
  offline = false,
  requireBeforeSale = true,
  errorPrefix = 'MULTIKASSA',
}) {
  try {
    const result = await validateFiscalMarking({ cashRegisterId, cartItems, refund });
    if (!result || result.status === MARKING_VALIDATION_STATUS.NOT_REQUIRED) return;
    if (result.status === MARKING_VALIDATION_STATUS.VALID) return;
    if (result.status === MARKING_VALIDATION_STATUS.REJECTED) {
      const err = new Error(result.message || `Код маркировки отклонён (${result.code || '?'})`);
      err.code = `${errorPrefix}_MARKING_REJECTED`;
      err.markingCode = result.code;
      throw err;
    }
    const err = new Error(result.message || 'Сервис проверки маркировки недоступен');
    err.code = `${errorPrefix}_MARKING_UNAVAILABLE`;
    err.soft = true;
    throw err;
  } catch (err) {
    if (err?.code === `${errorPrefix}_MARKING_REJECTED` || err?.code === `${errorPrefix}_MARKING_UNAVAILABLE`) {
      throw err;
    }
    const wrapped = new Error(err?.message || 'Не удалось проверить маркировку');
    wrapped.code = `${errorPrefix}_MARKING_UNAVAILABLE`;
    wrapped.cause = err;
    wrapped.soft = true;
    throw wrapped;
  }
}
