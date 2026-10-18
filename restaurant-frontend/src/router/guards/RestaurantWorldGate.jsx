import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { fetchRestaurantAppAccess } from '../../utils/fetchRestaurantAppAccess';
import { isRestaurantDesktop } from '../../utils/restaurantDesktop';
import WrongAppScreen from '../../features/auth/components/WrongAppScreen';

/**
 * Blocks grocery/pharmacy/platform sessions on r-aurent with a clear message.
 * Do not remount the SPA while re-checking — that aborts in-flight dialogs.
 * Restaurant desktop (edge) skips this gate — local company types may be empty before catalog bootstrap.
 */
export default function RestaurantWorldGate({ children }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const desktop = isRestaurantDesktop();
  const [loading, setLoading] = useState(Boolean(token) && !desktop);
  const [denied, setDenied] = useState(null);
  const allowedRef = useRef(desktop);

  useEffect(() => {
    if (!hasHydrated) return undefined;
    if (desktop) {
      allowedRef.current = true;
      setDenied(null);
      setLoading(false);
      return undefined;
    }
    if (!token) {
      allowedRef.current = false;
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const firstCheck = !allowedRef.current;
    if (firstCheck) setLoading(true);

    (async () => {
      const { access, fetchError } = await fetchRestaurantAppAccess(user?.role);
      if (cancelled) return;

      if (fetchError) {
        if (allowedRef.current) {
          setLoading(false);
          return;
        }
        allowedRef.current = true;
        setDenied(null);
        setLoading(false);
        return;
      }

      if (!access.ok) {
        allowedRef.current = false;
        logoutAndResetSession();
        setDenied(access.reason || 'not_restaurant');
        setLoading(false);
        return;
      }

      allowedRef.current = true;
      setDenied(null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [hasHydrated, token, user?.role, user?.companyId, desktop]);

  if (denied) {
    return <WrongAppScreen t={t} />;
  }
  if (!hasHydrated || loading) {
    return (
      <div className="wrong-app">
        <p className="wrong-app__body">{t('common.loading')}</p>
      </div>
    );
  }
  return children;
}
