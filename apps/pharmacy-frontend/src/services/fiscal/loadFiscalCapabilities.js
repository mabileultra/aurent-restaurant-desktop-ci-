import { fiscalApi } from '../../api/fiscal.api';

/**
 * Настройки фискализации кассы (Multikassa или FiscalDrive).
 * Ошибка API ≠ «выключено» — иначе продажа уйдёт без фискала.
 */
export async function loadFiscalCapabilities(
  storeId,
  cashRegisterId = null,
  { allowLoadFailureAsDisabled = false } = {},
) {
  try {
    const capsRes = await fiscalApi.getCashierCapabilities(storeId, cashRegisterId);
    return capsRes?.data || { enabled: false, fiscalProvider: 'MULTIKASSA' };
  } catch (err) {
    if (allowLoadFailureAsDisabled) {
      return { enabled: false, loadFailed: true, fiscalProvider: 'MULTIKASSA' };
    }
    const e = new Error(
      err?.response?.data?.message
        || err?.message
        || 'Не удалось загрузить настройки фискализации. Проверьте сеть и повторите продажу.',
    );
    e.code = 'FISCAL_CAPABILITIES_LOAD_FAILED';
    e.cause = err;
    throw e;
  }
}
