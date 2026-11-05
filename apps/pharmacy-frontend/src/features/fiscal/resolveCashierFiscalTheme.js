import { FISCAL_PROVIDER, isFiscalDriveProvider } from '../../services/fiscal';

/** Какая фискальная тема на кассе: одна, не обе сразу. */
export function resolveCashierFiscalTheme(caps) {
  return isFiscalDriveProvider(caps) ? FISCAL_PROVIDER.FISCAL_DRIVE : FISCAL_PROVIDER.MULTIKASSA;
}

export const FISCAL_CASHIER_CAPS_KEY = 'fiscal-cashier-caps';
