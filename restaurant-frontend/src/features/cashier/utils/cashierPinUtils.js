export const PIN_LOGIN_HERO_URL = '/cashier/pin-login-hero.webp';
export const PIN_LOGIN_HERO_FALLBACK_URL = '/cashier/pin-login-hero.jpg';

export const PIN_MIN = 4;

/** Login pad accepts exactly 4 digits (slots on screen). */
export const PIN_MAX = 4;

export function normalizePin(value) {
  return String(value || '').replace(/\D/g, '').slice(0, PIN_MAX);
}
