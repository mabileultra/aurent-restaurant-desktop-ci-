import { getMainAppUrl } from '../config/mainAppUrl';

/** Platform users belong on aurent.uz — not this SPA. */
export function redirectPlatformUserToMainApp() {
  const base = getMainAppUrl();
  window.location.assign(`${base}/login`);
}
