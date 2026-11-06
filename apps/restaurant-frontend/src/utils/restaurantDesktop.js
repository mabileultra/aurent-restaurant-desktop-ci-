/** True when running inside restaurant-desktop Electron (not Aurent Cashier). */
export function isRestaurantDesktop() {
  return typeof window !== 'undefined' && Boolean(window.aurentRestaurant?.isDesktop);
}

export async function getRestaurantDesktopStatus() {
  if (!isRestaurantDesktop()) return null;
  try {
    if (typeof window.aurentRestaurant.getStatus === 'function') {
      return await window.aurentRestaurant.getStatus();
    }
  } catch {
    /* ignore */
  }
  return null;
}
