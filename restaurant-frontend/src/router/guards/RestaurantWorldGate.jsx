import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { fetchRestaurantAppAccess } from '../../utils/fetchRestaurantAppAccess';
import WrongAppScreen from '../../features/auth/components/WrongAppScreen';

/**
 * Blocks grocery/pharmacy/platform sessions on r-aurent with a clear message.
 */
export default function RestaurantWorldGate({ children }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [loading, setLoading] = useState(Boolean(token));
  const [denied, setDenied] = useState(null);

  useEffect(() => {
    if (!hasHydrated) return undefined;
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      const { access } = await fetchRestaurantAppAccess(user?.role);
      if (cancelled) return;
      if (!access.ok) {
        logoutAndResetSession();
        setDenied(access.reason || 'not_restaurant');
        setLoading(false);
        return;
      }
      setDenied(null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [hasHydrated, token, user?.role, user?.companyId]);

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
