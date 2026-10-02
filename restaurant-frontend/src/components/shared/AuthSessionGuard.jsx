import { useEffect, useLayoutEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { redirectIfStoredTokenExpired } from '../../utils/authSessionExpiry';
import { startAuthIdleWatch } from '../../utils/authIdleTimeout';
import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineSetSession,
  rstOfflineStartRuntime,
} from '../../services/offline/restaurantOfflineBridge';

function resolveStoreId(user) {
  const ids = Array.isArray(user?.storeIds) ? user.storeIds.map(Number).filter(Number.isFinite) : [];
  if (ids.length) return ids[0];
  if (user?.storeId != null) return Number(user.storeId);
  return null;
}

/** After rehydrate — drop expired JWT; while logged in — idle logout (~15 min). */
export default function AuthSessionGuard({ children }) {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useLayoutEffect(() => {
    if (!hydrated) return;
    redirectIfStoredTokenExpired();
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated || !token) return undefined;
    return startAuthIdleWatch();
  }, [hydrated, token]);

  // Push JWT + store into Electron outbox sender when restaurant local-first is on.
  useEffect(() => {
    if (!hydrated || !isRestaurantOfflineBridge() || !isRestaurantLocalFirstDesktop()) return undefined;
    if (!token) {
      void rstOfflineSetSession({ authToken: null, storeId: null });
      return undefined;
    }
    const storeId = resolveStoreId(user);
    void (async () => {
      await rstOfflineStartRuntime();
      await rstOfflineSetSession({ authToken: token, storeId });
    })();
    return undefined;
  }, [hydrated, token, user]);

  return children;
}
