import { loadMultikassaCapabilities } from '../multikassa/loadMultikassaCapabilities';
import { FISCAL_PROVIDER, isFiscalDriveProvider } from './fiscalProviderIds';
import { loadFiscalCapabilities } from './loadFiscalCapabilities';
import { resolveFiscalProvider } from './resolveFiscalProvider';

/** Lab-only: bake VITE_LAB_FORCE_MULTIKASSA=true. Prod must stay false — FiscalDrive for tax. */
export function isLabForceMultikassa() {
  return String(import.meta.env.VITE_LAB_FORCE_MULTIKASSA || '').toLowerCase() === 'true';
}

/**
 * Настройки фискализации кассы + выбранный провайдер.
 * На lab (VITE_LAB_FORCE_MULTIKASSA) FiscalDrive с сервера уводим в Multikassa.
 * На prod провайдер как вернул API.
 */
export async function loadFiscalContext(storeId, cashRegisterId = null, options = {}) {
  const reported = await loadFiscalCapabilities(storeId, cashRegisterId, options);
  if (!isFiscalDriveProvider(reported) || !isLabForceMultikassa()) {
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
