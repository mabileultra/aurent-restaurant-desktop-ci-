import { useCallback, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useViewportProfile } from '../../../../hooks/useViewportProfile';
import {
  readWaiterMobilePrefs,
  writeWaiterMobilePrefs,
} from '../utils/waiterMobilePrefs';

const MOBILE_SHELL_ROLES = new Set(['WAITER', 'ADMIN', 'MANAGER']);

function isDesktopElectronShell() {
  return typeof window !== 'undefined' && Boolean(
    window.aurentRestaurant?.isDesktop || window.desktopCashier?.isDesktop,
  );
}

/**
 * Compact waiter shell: auto on phone-narrow screens, or forced via header icon.
 * Never on Electron / short landscape POS terminals (~1000×500).
 */
export function useWaiterMobileLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const { compact, posTerminal } = useViewportProfile();
  const [forceMobile, setForceMobileState] = useState(
    () => readWaiterMobilePrefs().forceMobile,
  );

  const canUse = MOBILE_SHELL_ROLES.has(String(role || '').toUpperCase());
  const lockDesktop = isDesktopElectronShell() || posTerminal;
  const enabled = canUse && !lockDesktop && (compact || forceMobile);

  const setForceMobile = useCallback((next) => {
    const value = Boolean(next);
    writeWaiterMobilePrefs({ forceMobile: value });
    setForceMobileState(value);
  }, []);

  const enterMobile = useCallback(() => setForceMobile(true), [setForceMobile]);
  const exitMobile = useCallback(() => setForceMobile(false), [setForceMobile]);

  return {
    enabled,
    compact,
    forceMobile,
    canUse,
    lockDesktop,
    /** Show desktop→mobile icon next to languages. */
    showEnterMobile: canUse && !enabled && !lockDesktop,
    /** Show leave-mobile in profile when user forced it (or on wide + mobile). */
    showExitMobile: canUse && enabled && (forceMobile || !compact),
    enterMobile,
    exitMobile,
    setForceMobile,
  };
}
