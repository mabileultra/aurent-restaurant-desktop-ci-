import { isDesktopCashier, normalizeCompanyLoginCode } from '../../../utils/authLogin';
import { normalizePin } from './cashierPinUtils';

/** Desktop only: last successful PIN → unlock when Identity is unreachable. */
export const PHARMACY_OFFLINE_PIN_KEY = 'pos.pharmacy.offlinePinAuth';

async function digestPin(companyLoginCode, pin) {
  const payload = `${companyLoginCode}:${normalizePin(pin)}`;
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Electron/old WebView fallback — not cryptographic; desktop prefers subtle.
  let h = 0;
  for (let i = 0; i < payload.length; i += 1) h = ((h << 5) - h + payload.charCodeAt(i)) | 0;
  return `fb:${h}`;
}

function readEnvelope() {
  try {
    const raw = localStorage.getItem(PHARMACY_OFFLINE_PIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.pinDigest || !parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {{ companyLoginCode: string, pin: string, token: string, user: object }} args
 */
export async function rememberPharmacyOfflinePinAuth({ companyLoginCode, pin, token, user }) {
  if (!isDesktopCashier() || !token || !user) return;
  const code = normalizeCompanyLoginCode(companyLoginCode);
  if (!code || normalizePin(pin).length < 4) return;
  try {
    const pinDigest = await digestPin(code, pin);
    localStorage.setItem(
      PHARMACY_OFFLINE_PIN_KEY,
      JSON.stringify({
        companyLoginCode: code,
        pinDigest,
        token,
        user,
        at: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPharmacyOfflinePinAuth() {
  try {
    localStorage.removeItem(PHARMACY_OFFLINE_PIN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @returns {Promise<{ token: string, user: object } | null>}
 */
export async function tryPharmacyOfflinePinLogin({ companyLoginCode, pin }) {
  if (!isDesktopCashier()) return null;
  const code = normalizeCompanyLoginCode(companyLoginCode);
  const pinNorm = normalizePin(pin);
  if (!code || pinNorm.length < 4) return null;
  const env = readEnvelope();
  if (!env) return null;
  if (normalizeCompanyLoginCode(env.companyLoginCode) !== code) return null;
  const pinDigest = await digestPin(code, pinNorm);
  if (pinDigest !== env.pinDigest) return null;
  if (env.user?.role !== 'CASHIER') return null;
  return { token: env.token, user: env.user };
}

/** Lock-screen unlock without Identity when offline. */
export async function tryPharmacyOfflinePinUnlock({ pin, userId }) {
  if (!isDesktopCashier()) return false;
  const env = readEnvelope();
  if (!env?.user?.id || String(env.user.id) !== String(userId || '')) return false;
  const code = normalizeCompanyLoginCode(env.companyLoginCode);
  if (!code) return false;
  const pinDigest = await digestPin(code, pin);
  return pinDigest === env.pinDigest;
}
