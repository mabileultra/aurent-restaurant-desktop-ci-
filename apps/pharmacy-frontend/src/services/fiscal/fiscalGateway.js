import { loadMultikassaCapabilities } from '../multikassa/loadMultikassaCapabilities';
import { FISCAL_PROVIDER, isFiscalDriveProvider } from './fiscalProviderIds';
import { loadFiscalCapabilities } from './loadFiscalCapabilities';
import { resolveFiscalProvider } from './resolveFiscalProvider';

/**
 * Настройки фискализации кассы + выбранный провайдер.
 * FiscalDrive на кассе пока выключен: если сервер вернул FISCAL_DRIVE, смена и чек идут в Multikassa.
 */
export async function loadFiscalContext(storeId, cashRegisterId = null, options = {}) {
  const reported = await loadFiscalCapabilities(storeId, cashRegisterId, options);
  if (!isFiscalDriveProvider(reported)) {
    return {
      capabilities: reported,
      provider: resolveFiscalProvider(reported?.fiscalProvider),
    };
  }
  const mk = await loadMultikassaCapabilities(storeId, cashRegisterId, options);
  const capabilities = {
    ...(mk || { enabled: false }),
    fiscalProvider: FISCAL_PROVIDER.MULTIKASSA,
  };
  return {
    capabilities,
    provider: resolveFiscalProvider(FISCAL_PROVIDER.MULTIKASSA),
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
