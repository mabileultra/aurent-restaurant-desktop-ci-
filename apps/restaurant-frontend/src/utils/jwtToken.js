/** Разбор JWT без проверки подписи — только для client-side exp. */

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token) {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

/** @param {number} [skewMs] — запас на рассинхрон часов */
export function isJwtExpired(token, skewMs = 30_000) {
  const expMs = getJwtExpiryMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

export function isJwtExpiringWithin(token, withinMs) {
  const expMs = getJwtExpiryMs(token);
  if (expMs == null) return false;
  return expMs - Date.now() <= withinMs;
}
