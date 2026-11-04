import { multikassaApi } from '../../api/multikassa.api';

/**
 * Настройки Multikassa для кассы.
 * Важно: ошибка API ≠ «выключено» — иначе продажа уходит без фискала молча.
 * Offline может передать allowLoadFailureAsDisabled=true.
 */
export async function loadMultikassaCapabilities(
  storeId,
  cashRegisterId = null,
  { allowLoadFailureAsDisabled = false } = {},
) {
  try {
    const capsRes = await multikassaApi.getCashierCapabilities(storeId, cashRegisterId);
    return capsRes?.data || { enabled: false };
  } catch (err) {
    if (allowLoadFailureAsDisabled) {
      return { enabled: false, loadFailed: true };
    }
    const e = new Error(
      err?.response?.data?.message ||
        err?.message ||
        'Не удалось загрузить настройки Multikassa. Проверьте сеть и повторите продажу.',
    );
    e.code = 'MULTIKASSA_CAPABILITIES_LOAD_FAILED';
    e.cause = err;
    throw e;
  }
}

export function wrapMultikassaFiscalError(err) {
  if (err?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || err?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
    const e = new Error('MULTIKASSA_OFFLINE_BLOCKED');
    e.code = 'MULTIKASSA_OFFLINE_BLOCKED';
    return e;
  }
  if (err?.code === 'MULTIKASSA_BROWSER_LOCALHOST') {
    const e = new Error(err.message || 'MULTIKASSA_BROWSER_LOCALHOST');
    e.code = 'MULTIKASSA_BROWSER_LOCALHOST';
    e.cause = err;
    return e;
  }
  if (err?.code === 'MULTIKASSA_CAPABILITIES_LOAD_FAILED') {
    const e = new Error(err.message || 'MULTIKASSA_CAPABILITIES_LOAD_FAILED');
    e.code = 'MULTIKASSA_CAPABILITIES_LOAD_FAILED';
    e.cause = err;
    return e;
  }
  const e = new Error(err?.message || 'MULTIKASSA_FISCAL_FAILED');
  e.code = 'MULTIKASSA_FISCAL_FAILED';
  e.cause = err;
  return e;
}
