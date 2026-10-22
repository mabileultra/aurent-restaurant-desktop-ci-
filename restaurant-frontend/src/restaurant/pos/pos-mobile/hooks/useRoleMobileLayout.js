import { useCallback, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useViewportProfile } from '../../../../hooks/useViewportProfile';
import {
  readRoleMobilePrefs,
  writeRoleMobilePrefs,
} from '../utils/roleMobilePrefs';

function isDesktopElectronShell() {
  return typeof window !== 'undefined' && Boolean(
    window.aurentRestaurant?.isDesktop || window.desktopCashier?.isDesktop,
  );
}

/**
 * Compact phone shell for a POS role family (cashier / cook / …).
 * Auto on narrow screens, or forced via header icon. Off on Electron / POS terminals.
 */
export function useRoleMobileLayout({
  prefsKey,
  allowedRoles,
}) {
  const role = useAuthStore((s) => s.user?.role);
  const { compact, posTerminal } = useViewportProfile();
  const [forceMobile, setForceMobileState] = useState(
    () => readRoleMobilePrefs(prefsKey).forceMobile,
  );

  const roleUpper = String(role || '').toUpperCase();
  const canUse = allowedRoles.has(roleUpper);
  const lockDesktop = isDesktopElectronShell() || posTerminal;
  const enabled = canUse && !lockDesktop && (compact || forceMobile);

  const setForceMobile = useCallback((next) => {
    const value = Boolean(next);
    writeRoleMobilePrefs(prefsKey, { forceMobile: value });
    setForceMobileState(value);
  }, [prefsKey]);

  const enterMobile = useCallback(() => setForceMobile(true), [setForceMobile]);
  const exitMobile = useCallback(() => setForceMobile(false), [setForceMobile]);

  return {
    enabled,
    compact,
    forceMobile,
    canUse,
    lockDesktop,
    showEnterMobile: canUse && !enabled && !lockDesktop,
    showExitMobile: canUse && enabled && (forceMobile || !compact),
    enterMobile,
    exitMobile,
    setForceMobile,
  };
}
