import { getMainAppUrl } from '../config/env';
import { logoutAndResetSession } from './authSession';

let leaving = false;

export function isLeavingToMainLogin() {
  return leaving;
}

/** Сразу на вход aurent, без кадра кассы. */
export function leaveToMainLogin() {
  leaving = true;
  logoutAndResetSession();
  const base = String(getMainAppUrl() || '').replace(/\/+$/, '');
  window.location.replace(`${base}/login`);
}
