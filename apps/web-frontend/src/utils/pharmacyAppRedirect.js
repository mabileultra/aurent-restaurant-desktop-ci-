/**
 * Cross-origin handoff to pharmacy SPA via Identity one-time code (no JWT in URL).
 */
import { buildHandoffAcceptUrl, HANDOFF_AUDIENCE } from '@aurent/shared-auth';
import { authApi } from '../api/auth.api';
import { getPharmacyAppUrl } from '../config/pharmacyAppUrl';

/** Paths that belong on the pharmacy product after cutover. */
export function isPharmacySpaPath(path) {
  const p = String(path || '');
  return p === '/pharm' || p.startsWith('/pharm/') || p === '/pharmacy' || p.startsWith('/pharmacy/');
}

/**
 * Create handoff code and navigate to p-aurent /auth/accept?code=…&next=…
 * @returns {Promise<boolean>} true if navigation started
 */
export async function redirectToPharmacyApp(path, { audience = HANDOFF_AUDIENCE.PHARMACY } = {}) {
  const base = getPharmacyAppUrl();
  if (!base) return false;

  const { data } = await authApi.createHandoff({ audience });
  if (!data?.code) {
    throw new Error('Handoff code missing');
  }

  const target = buildHandoffAcceptUrl(base, {
    code: data.code,
    next: mapMainPathToPharmacyPath(path),
  });
  if (!target) return false;
  window.location.assign(target);
  return true;
}

export function mapMainPathToPharmacyPath(path) {
  const p = String(path || '');
  if (p.startsWith('/pharm/pos') || p === '/pharm' || p === '/cashier/pharmacy') {
    return '/pos';
  }
  if (p.startsWith('/pharm/stock/products') || p.endsWith('/stock/products')) {
    return '/stock/products';
  }
  if (p.startsWith('/pharm/stock/receipts')) {
    return p.replace(/^\/pharm/, '');
  }
  if (p.startsWith('/pharm/stock/asl')) {
    return p.replace(/^\/pharm/, '');
  }
  if (p.startsWith('/pharm/stock')) {
    return p.replace(/^\/pharm/, '') || '/stock/products';
  }
  if (p === '/dashboard' || p.startsWith('/dashboard')) return '/dashboard';
  if (p === '/returns' || p.startsWith('/sales')) {
    return p.startsWith('/returns') ? '/returns' : '/sales';
  }
  if (p === '/pos' || p.startsWith('/stock') || p.startsWith('/dashboard')) return p;
  return '/pos';
}
