import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { fetchMainAppAccess } from '../../utils/fetchMainAppAccess';
import { isPlatformUser } from '../../utils/platformRoles';
import WrongAppScreen from '../../features/auth/components/WrongAppScreen';

/**
 * Blocks restaurant-only accounts on aurent.uz (no silent hop to r-aurent).
 */
export default function MainWorldGate({ children }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [loading, setLoading] = useState(Boolean(token));
  const [denied, setDenied] = useState(null);

  useEffect(() => {
    if (!hasHydrated) return undefined;
    if (!token || isPlatformUser(user?.role)) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      const { access } = await fetchMainAppAccess(user?.role);
      if (cancelled) return;
      if (!access.ok) {
        logoutAndResetSession();
        setDenied(access.reason || 'restaurant_only');
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
    return null;
  }
  return children;
}
