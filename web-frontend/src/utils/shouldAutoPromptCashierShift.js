import { isAuthHttpError } from './authSessionExpiry';

/**
 * Показывать «откройте смену» только после settled fetch.
 * Не смотреть на lagged latch: на reload query уже OPEN, а shiftIsOpen ещё false —
 * иначе модалка выскакивает поверх уже открытой смены.
 */
export function shouldAutoPromptCashierShift({
  shiftFetched,
  shiftFetching = false,
  shiftStatus = null,
  shiftQueryError,
} = {}) {
  if (!shiftFetched || shiftFetching) return false;
  if (shiftStatus === 'OPEN') return false;
  if (shiftQueryError && isAuthHttpError(shiftQueryError)) return false;
  return true;
}
