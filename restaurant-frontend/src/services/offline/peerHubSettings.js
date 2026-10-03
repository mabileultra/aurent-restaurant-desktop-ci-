/** Persist peer Electron hub URL for multi-terminal auto-pull. */

import { getConfiguredHubUrl } from './waiterPwa/outboxSync';

const PEER_HUB_URL_KEY = 'rst-peer-hub-url';
const PEER_HUB_AUTO_KEY = 'rst-peer-hub-auto';

export function getPeerHubUrl() {
  try {
    const own = String(localStorage.getItem(PEER_HUB_URL_KEY) || '').replace(/\/$/, '');
    if (own) return own;
    // Same LAN hub the waiter phone uses (monoblock) — main PC must pull it too.
    return getConfiguredHubUrl();
  } catch {
    return '';
  }
}

export function setPeerHubUrl(url) {
  try {
    if (!url) localStorage.removeItem(PEER_HUB_URL_KEY);
    else localStorage.setItem(PEER_HUB_URL_KEY, String(url).replace(/\/$/, ''));
  } catch {
    /* ignore */
  }
}

/**
 * Default ON when a hub URL exists — otherwise main PC never sees waiter punches.
 * Explicit '0' turns auto-pull off.
 */
export function isPeerHubAutoSync() {
  try {
    const v = localStorage.getItem(PEER_HUB_AUTO_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
    return Boolean(getPeerHubUrl());
  } catch {
    return false;
  }
}

export function setPeerHubAutoSync(on) {
  try {
    if (on) localStorage.setItem(PEER_HUB_AUTO_KEY, '1');
    else localStorage.setItem(PEER_HUB_AUTO_KEY, '0');
  } catch {
    /* ignore */
  }
}

export const BOOTSTRAP_REFRESH_EVENT = 'rst-lf-bootstrap-refresh';
export const HUB_DIRTY_EVENT = 'rst-lf-hub-dirty';

export function requestRestaurantBootstrapRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BOOTSTRAP_REFRESH_EVENT));
}

export function emitHubFloorDirty(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HUB_DIRTY_EVENT, { detail }));
}
