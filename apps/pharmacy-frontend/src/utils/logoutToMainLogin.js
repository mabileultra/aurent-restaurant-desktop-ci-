import { getMainAppUrl } from '../config/env';
import { logoutAndResetSession } from './authSession';

/**
 * Pharmacy + aurent.uz — разные origin/localStorage.
 * Выход только на p-aurent оставляет сессию на aurent → /login снова handoff в админку.
 */
export function logoutToMainLogin() {
  logoutAndResetSession();
  const base = getMainAppUrl();
  window.location.assign(`${base}/login?logout=1`);
}
