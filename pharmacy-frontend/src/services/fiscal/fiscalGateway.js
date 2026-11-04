import { loadFiscalCapabilities } from './loadFiscalCapabilities';
import { resolveFiscalProvider } from './resolveFiscalProvider';

/**
 * Настройки фискализации кассы + выбранный провайдер.
 * Не ходит в Multikassa API: GET /cashier/fiscal.
 */
export async function loadFiscalContext(storeId, cashRegisterId = null, options = {}) {
  const capabilities = await loadFiscalCapabilities(storeId, cashRegisterId, options);
  return {
    capabilities,
    provider: resolveFiscalProvider(capabilities?.fiscalProvider),
  };
}

/** Ошибка до выбора провайдера — уже размеченный код не перекрашиваем в Multikassa. */
export function wrapFiscalError(err, provider = null) {
  const code = String(err?.code || '');
  if (code.startsWith('FISCAL_') || code.startsWith('MULTIKASSA_')) return err;
  return (provider || resolveFiscalProvider(null)).wrapError(err);
}

/** Провайдер, которым был начат отложенный фискальный чек; старые записи без поля — Multikassa. */
export function resolvePendingFiscalProvider(payload) {
  return resolveFiscalProvider(payload?.fiscal?.fiscalProvider);
}
