import { useCallback, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useViewportProfile } from '../../../../hooks/useViewportProfile';
import {
  readRoleMobilePrefs,
  writeRoleMobilePrefs,
} from '../utils/roleMobilePrefs';

/**
 * Compact phone shell for a POS role family (cashier / cook / …).
 * Auto below desktop width (1024), or forced via header icon.
 * Short landscape POS terminals stay on the desktop floor UI.
 */
export function useRoleMobileLayout({
  prefsKey,
  allowedRoles,
}) {
  const role = useAuthStore((s) => s.user?.role);
  const { compact, desktop, posTerminal } = useViewportProfile();
  const [forceMobile, setForceMobileState] = useState(
    () => readRoleMobilePrefs(prefsKey).forceMobile,
  );

  const roleUpper = String(role || '').toUpperCase();
  const canUse = allowedRoles.has(roleUpper);
  /** Width under 1024 — switch to mobile; no broken mid-size desktop board. */
  const autoMobile = !desktop;
  const lockDesktop = posTerminal;
  const enabled = canUse && !lockDesktop && (autoMobile || forceMobile);

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
    showExitMobile: canUse && enabled && (forceMobile || desktop),
    enterMobile,
    exitMobile,
    setForceMobile,
  };
}
