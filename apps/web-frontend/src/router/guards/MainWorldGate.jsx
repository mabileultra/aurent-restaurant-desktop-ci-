import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { fetchMainAppAccess } from '../../utils/fetchMainAppAccess';
import { isPlatformUser } from '../../utils/platformRoles';
import WrongAppScreen from '../../features/auth/components/WrongAppScreen';

/**
 * Blocks restaurant-only accounts on aurent.uz (no silent hop to r-aurent).
 * Do not remount the SPA while re-checking — that aborts file pick / import.
 */
export default function MainWorldGate({ children }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [loading, setLoading] = useState(Boolean(token));
  const [denied, setDenied] = useState(null);
  const allowedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return undefined;
    if (!token || isPlatformUser(user?.role)) {
      allowedRef.current = Boolean(token) && isPlatformUser(user?.role);
      setDenied(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const firstCheck = !allowedRef.current;
    if (firstCheck) setLoading(true);

    (async () => {
      const { access, fetchError } = await fetchMainAppAccess(user?.role);
      if (cancelled) return;

      // Transport / API blip: keep an already-allowed session (import file dialog
      // refocus must not log the user out or unmount the pick page).
      if (fetchError) {
        if (allowedRef.current) {
          setLoading(false);
          return;
        }
        // First paint with no types yet — fail open so pharmacy is not locked out
        // when /company-business-types is briefly down. Explicit restaurant payload
        // still denies below when the API succeeds.
        allowedRef.current = true;
        setDenied(null);
        setLoading(false);
        return;
      }

      if (!access.ok) {
        allowedRef.current = false;
        logoutAndResetSession();
        setDenied(access.reason || 'restaurant_only');
        setLoading(false);
        return;
      }

      allowedRef.current = true;
      setDenied(null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [hasHydrated, token, user?.role, user?.companyId]);

  if (denied) {
    return <WrongAppScreen t={t} />;
  }
  if (!hasHydrated || loading) {
    return null;
  }
  return children;
}
