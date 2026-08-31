import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { redirectIfStoredTokenExpired } from '../../utils/authSessionExpiry';

/** После rehydrate localStorage — сразу выкинуть на PIN, если JWT истёк. */
export default function AuthSessionGuard({ children }) {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!hydrated) return;
    redirectIfStoredTokenExpired();
  }, [hydrated, token]);

  return children;
}
