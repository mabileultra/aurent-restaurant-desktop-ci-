import { isAuthHttpError } from './authSessionExpiry';

/** Не показывать «откройте смену», если смена не загрузилась из-за 401/403. */
export function shouldAutoPromptCashierShift({ shiftFetched, shiftIsOpen, shiftQueryError }) {
  if (!shiftFetched || shiftIsOpen) return false;
  if (shiftQueryError && isAuthHttpError(shiftQueryError)) return false;
  return true;
}
