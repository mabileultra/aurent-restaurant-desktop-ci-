import { useEffect, useLayoutEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { redirectIfStoredTokenExpired } from '../../utils/authSessionExpiry';
import { startAuthIdleWatch } from '../../utils/authIdleTimeout';
import { startPendingFiscalFlushLoop } from '../../restaurant/pos/utils/pendingFiscalQueue';
import OfdPendingConfirmBar from '../../restaurant/pos/components/OfdPendingConfirmBar';
import RestaurantDesktopStatusStrip from '../../restaurant/pos/components/RestaurantDesktopStatusStrip';

/** After rehydrate — drop expired JWT; while logged in — idle logout (~15 min). */
export default function AuthSessionGuard({ children }) {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);
  useLayoutEffect(() => {
    if (!hydrated) return;
    redirectIfStoredTokenExpired();
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated || !token) return undefined;
    return startAuthIdleWatch();
  }, [hydrated, token]);


  useEffect(() => {
    if (!hydrated || !token) return undefined;
    return startPendingFiscalFlushLoop();
  }, [hydrated, token]);

  return (
    <>
      <RestaurantDesktopStatusStrip />
      {children}
      <OfdPendingConfirmBar />
    </>
  );
}
