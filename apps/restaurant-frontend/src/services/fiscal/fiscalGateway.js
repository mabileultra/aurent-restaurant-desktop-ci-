import { loadMultikassaCapabilities } from '../multikassa';
import { resolveFiscalProvider } from './resolveFiscalProvider';

/**
 * Настройки фискализации кассы + выбранный провайдер.
 * Провайдер берётся из capabilities.fiscalProvider; пока поля нет — Multikassa.
 */
export async function loadFiscalContext(storeId, cashRegisterId = null, options = {}) {
  const capabilities = await loadMultikassaCapabilities(storeId, cashRegisterId, options);
  return {
    capabilities,
    provider: resolveFiscalProvider(capabilities?.fiscalProvider),
  };
}

/** Ошибка до выбора провайдера (например, не загрузились настройки) — оборачивает провайдер по умолчанию. */
export function wrapFiscalError(err, provider = null) {
  return (provider || resolveFiscalProvider(null)).wrapError(err);
}

/** Провайдер, которым был начат отложенный фискальный чек; старые записи без поля — Multikassa. */
export function resolvePendingFiscalProvider(payload) {
  return resolveFiscalProvider(payload?.fiscal?.fiscalProvider);
}
