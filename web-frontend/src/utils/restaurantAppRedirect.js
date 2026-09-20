import { getRestaurantAppUrl } from '../config/restaurantAppUrl';
import { isPlatformUser } from './platformRoles';

/** Paths that belong on the restaurant SPA when split is enabled. */
export function isRestaurantSpaPath(path) {
  const p = String(path || '');
  return p === '/rst' || p.startsWith('/rst/');
}

/**
 * Full navigation to restaurant SPA with one-time token handoff in the hash
 * (hash is not sent to servers; accept page stores it then clears the URL).
 */
export function redirectToRestaurantApp(path, { token, user } = {}) {
  const base = getRestaurantAppUrl();
  if (!base) return false;

  const nextPath = isRestaurantSpaPath(path) ? path : '/rst/pos';
  const url = new URL('/auth/accept', `${base}/`);
  url.searchParams.set('next', nextPath);

  if (token) {
    const payload = JSON.stringify({
      token,
      user: user || null,
      ts: Date.now(),
    });
    url.hash = `handoff=${encodeURIComponent(payload)}`;
  }

  window.location.assign(url.toString());
  return true;
}

/** After login: send restaurant roles to the other origin when configured. */
export function maybeRedirectRestaurantLogin(role, path, auth) {
  if (isPlatformUser(role)) return false;
  if (!isRestaurantSpaPath(path)) return false;
  return redirectToRestaurantApp(path, auth);
}
