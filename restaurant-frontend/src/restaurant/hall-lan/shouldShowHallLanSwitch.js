import { isAlreadyOnLanHub } from './isAlreadyOnLanHub';

/**
 * Show «switch to LAN» only for cloud phones when hall PC signal says so.
 */
export function shouldShowHallLanSwitch({
  isDesktop = false,
  hostname,
  presence,
} = {}) {
  if (isDesktop) return false;
  if (isAlreadyOnLanHub(hostname)) return false;
  if (!presence || presence.known === false) return false;
  return Boolean(presence.switchToLan);
}
