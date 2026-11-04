/**
 * Cross-origin handoff to pharmacy SPA via Identity one-time code (no JWT in URL).
 */
import { authApi } from '../api/auth.api';
import { getPharmacyAppUrl } from '../config/pharmacyAppUrl';
import { PHARM_POS_PATH } from '../pharmacy/app/pharmacyPaths';

/** Paths that belong on the pharmacy product after cutover. */
export function isPharmacySpaPath(path) {
  const p = String(path || '');
  return p === '/pharm' || p.startsWith('/pharm/') || p === '/pharmacy' || p.startsWith('/pharmacy/');
}

/**
 * Create handoff code and navigate to p-aurent /auth/accept?code=…&next=…
 * @returns {Promise<boolean>} true if navigation started
 */
export async function redirectToPharmacyApp(path, { audience = 'PHARMACY' } = {}) {
  const base = getPharmacyAppUrl();
  if (!base) return false;

  const { data } = await authApi.createHandoff({ audience });
  if (!data?.code) {
    throw new Error('Handoff code missing');
  }

  const nextPath = mapMainPathToPharmacyPath(path);
  const url = new URL('/auth/accept', `${base}/`);
  url.searchParams.set('code', data.code);
  url.searchParams.set('next', nextPath);
  window.location.assign(url.toString());
  return true;
}

function mapMainPathToPharmacyPath(path) {
  const p = String(path || '');
  if (p.startsWith('/pharm/pos') || p === '/pharm' || p === '/cashier/pharmacy') {
    return '/pos';
  }
  if (p.startsWith('/pharm/stock/products') || p.includes('/stock/products')) {
    return '/stock/products';
  }
  if (p.startsWith('/pharm/stock')) {
    return p.replace(/^\/pharm/, '') || '/stock/products';
  }
  if (p.startsWith('/')) {
    // Already a pharmacy-SPA path (/pos, /stock/…)
    if (p === '/pos' || p.startsWith('/stock')) return p;
  }
  return PHARM_POS_PATH.replace(/^\/pharm/, '') || '/pos';
}
