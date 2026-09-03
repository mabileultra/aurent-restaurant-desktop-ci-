import { multikassaApi } from '../../api/multikassa.api';

/** Настройки Multikassa для кассы; при ошибке API — disabled. */
export async function loadMultikassaCapabilities(storeId, cashRegisterId = null) {
  try {
    const capsRes = await multikassaApi.getCashierCapabilities(storeId, cashRegisterId);
    return capsRes?.data || { enabled: false };
  } catch {
    return { enabled: false };
  }
}

export function wrapMultikassaFiscalError(err) {
  if (err?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || err?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
    const e = new Error('MULTIKASSA_OFFLINE_BLOCKED');
    e.code = 'MULTIKASSA_OFFLINE_BLOCKED';
    return e;
  }
  const e = new Error(err?.message || 'MULTIKASSA_FISCAL_FAILED');
  e.code = 'MULTIKASSA_FISCAL_FAILED';
  e.cause = err;
  return e;
}
