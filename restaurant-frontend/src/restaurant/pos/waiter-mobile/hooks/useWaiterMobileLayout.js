import { useCallback, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useViewportProfile } from '../../../../hooks/useViewportProfile';
import {
  readWaiterMobilePrefs,
  writeWaiterMobilePrefs,
} from '../utils/waiterMobilePrefs';

const MOBILE_SHELL_ROLES = new Set(['WAITER', 'ADMIN', 'MANAGER']);

/**
 * Compact waiter shell: auto on narrow screens, or forced via header icon.
 */
export function useWaiterMobileLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const { compact } = useViewportProfile();
  const [forceMobile, setForceMobileState] = useState(
    () => readWaiterMobilePrefs().forceMobile,
  );

  const canUse = MOBILE_SHELL_ROLES.has(String(role || '').toUpperCase());
  const enabled = canUse && (compact || forceMobile);

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
    /** Show desktop→mobile icon next to languages. */
    showEnterMobile: canUse && !enabled,
    /** Show leave-mobile in profile when user forced it (or on wide + mobile). */
    showExitMobile: canUse && enabled && (forceMobile || !compact),
    enterMobile,
    exitMobile,
    setForceMobile,
  };
}
