export const INSTALLER_MANIFEST_URL = '/downloads/desktop/manifest.json';
export const RESTAURANT_INSTALLER_MANIFEST_URL = '/downloads/restaurant-desktop/manifest.json';
export const PHARMACY_INSTALLER_MANIFEST_URL = '/downloads/pharmacy-desktop/manifest.json';

async function fetchManifest(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`manifest ${res.status}`);
  }
  return res.json();
}

export async function fetchInstallerManifest() {
  return fetchManifest(INSTALLER_MANIFEST_URL);
}

export async function fetchRestaurantInstallerManifest() {
  return fetchManifest(RESTAURANT_INSTALLER_MANIFEST_URL);
}

export async function fetchPharmacyInstallerManifest() {
  return fetchManifest(PHARMACY_INSTALLER_MANIFEST_URL);
}
