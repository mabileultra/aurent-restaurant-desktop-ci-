import { DEFAULT_FISCAL_PROVIDER, FISCAL_PROVIDER } from './fiscalProviderIds';
import { fiscalDriveFiscalProvider } from './providers/fiscalDriveFiscalProvider';
import { multikassaFiscalProvider } from './providers/multikassaFiscalProvider';

/**
 * @typedef {object} FiscalProvider
 * @property {string} id
 * @property {(args: object) => Promise<object|null>} fiscalizeSale
 * @property {(args: object) => Promise<object|null>} fiscalizeRefund
 * @property {(args: object) => Promise<object|null>} fiscalizeShift
 * @property {(payload: object, options?: object) => Promise<object>} retryPending
 * @property {(err: unknown) => boolean} isShiftAlreadyOpenError
 * @property {(err: unknown) => Error} wrapError
 */

const PROVIDERS = Object.freeze({
  [FISCAL_PROVIDER.MULTIKASSA]: multikassaFiscalProvider,
  [FISCAL_PROVIDER.FISCAL_DRIVE]: fiscalDriveFiscalProvider,
});

/** Неизвестный или пустой id → провайдер по умолчанию (Multikassa), чтобы текущие кассы не менялись. */
export function resolveFiscalProvider(providerId) {
  const key = String(providerId || '').trim().toUpperCase();
  return PROVIDERS[key] || PROVIDERS[DEFAULT_FISCAL_PROVIDER];
}
