/** Persist peer Electron hub URL for multi-terminal auto-pull. */

const PEER_HUB_URL_KEY = 'rst-peer-hub-url';
const PEER_HUB_AUTO_KEY = 'rst-peer-hub-auto';

export function getPeerHubUrl() {
  try {
    return String(localStorage.getItem(PEER_HUB_URL_KEY) || '').replace(/\/$/, '');
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

export function isPeerHubAutoSync() {
  try {
    return localStorage.getItem(PEER_HUB_AUTO_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPeerHubAutoSync(on) {
  try {
    if (on) localStorage.setItem(PEER_HUB_AUTO_KEY, '1');
    else localStorage.removeItem(PEER_HUB_AUTO_KEY);
  } catch {
    /* ignore */
  }
}

export const BOOTSTRAP_REFRESH_EVENT = 'rst-lf-bootstrap-refresh';

export function requestRestaurantBootstrapRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BOOTSTRAP_REFRESH_EVENT));
}
