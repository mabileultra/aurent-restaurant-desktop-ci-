import { useCallback, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useViewportProfile } from '../../../../hooks/useViewportProfile';
import {
  readWaiterMobilePrefs,
  writeWaiterMobilePrefs,
} from '../utils/waiterMobilePrefs';

const MOBILE_SHELL_ROLES = new Set(['WAITER', 'ADMIN', 'MANAGER']);

/**
 * Compact waiter shell: auto below desktop width (1024), or forced via header icon.
 * Short landscape POS terminals stay on the desktop floor UI.
 */
export function useWaiterMobileLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const { compact, desktop, posTerminal } = useViewportProfile();
  const [forceMobile, setForceMobileState] = useState(
    () => readWaiterMobilePrefs().forceMobile,
  );

  const canUse = MOBILE_SHELL_ROLES.has(String(role || '').toUpperCase());
  const autoMobile = !desktop;
  const lockDesktop = posTerminal;
  const enabled = canUse && !lockDesktop && (autoMobile || forceMobile);

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
    showExitMobile: canUse && enabled && (forceMobile || desktop),
    enterMobile,
    exitMobile,
    setForceMobile,
  };
}
