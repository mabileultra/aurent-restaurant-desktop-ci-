import { HANDOFF_AUDIENCE, buildHandoffAcceptUrl } from '@aurent/shared-auth';
import { authApi } from '../api/auth.api';
import { getPharmacyAppUrl, isPharmacyAppSplitEnabled } from '../config/pharmacyAppUrl';
import { logoutAndResetSession } from './authSession';

let inFlightRedirectPromise = null;

/**
 * Cross-origin hop to pharmacy SPA with one-time Identity code (no JWT in URL).
 * @returns {Promise<boolean>} true if browser navigated away
 */
export async function redirectToPharmacyApp(nextPath = '/dashboard') {
  if (!isPharmacyAppSplitEnabled()) return false;
  const base = getPharmacyAppUrl();
  if (!base) return false;
  if (inFlightRedirectPromise) return inFlightRedirectPromise;

  inFlightRedirectPromise = (async () => {
    try {
      const { data } = await authApi.createHandoff({ audience: HANDOFF_AUDIENCE.PHARMACY });
      const code = data?.code;
      if (!code) return false;

      const href = buildHandoffAcceptUrl(base, { code, next: nextPath });
      if (!href) return false;

      logoutAndResetSession();
      window.location.replace(href);
      return true;
    } catch {
      return false;
    } finally {
      inFlightRedirectPromise = null;
    }
  })();

  return inFlightRedirectPromise;
}
