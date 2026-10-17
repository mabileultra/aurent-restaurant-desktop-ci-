const PROD_MAIN_APP = 'https://aurent.uz';

/** Public origin that hosts `/downloads/desktop/*`. */
export function getDownloadsOrigin() {
  const raw = String(import.meta.env.VITE_MAIN_APP_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  return PROD_MAIN_APP;
}

export function resolveDownloadAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getDownloadsOrigin();
  if (pathOrUrl.startsWith('/')) return `${base}${pathOrUrl}`;
  return `${base}/${pathOrUrl}`;
}

export function getInstallerManifestUrl() {
  // Separate from grocery cashier (`/downloads/desktop/`).
  if (import.meta.env.DEV) {
    return '/downloads/restaurant-desktop/manifest.json';
  }
  return resolveDownloadAssetUrl('/downloads/restaurant-desktop/manifest.json');
}

export async function fetchRestaurantInstallerManifest() {
  const res = await fetch(getInstallerManifestUrl(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`manifest ${res.status}`);
  }
  return res.json();
}
