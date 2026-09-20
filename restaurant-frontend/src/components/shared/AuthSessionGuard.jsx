import { useLayoutEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { redirectIfStoredTokenExpired } from '../../utils/authSessionExpiry';

/** После rehydrate — сброс протухшего JWT до отрисовки (не редиректить лендинг на login). */
export default function AuthSessionGuard({ children }) {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);

  useLayoutEffect(() => {
    if (!hydrated) return;
    redirectIfStoredTokenExpired();
  }, [hydrated, token]);

  return children;
}
