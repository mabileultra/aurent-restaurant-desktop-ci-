/** Desktop restaurant local-first bridge (Electron IPC). */

function desk() {
  return typeof window !== 'undefined' ? window.desktopCashier : null;
}

export function isRestaurantOfflineBridge() {
  const d = desk();
  return Boolean(d?.isDesktop && typeof d.rstOfflineGetStatus === 'function');
}

export function isRestaurantLocalFirstDesktop() {
  const d = desk();
  return Boolean(d?.restaurantLocalFirst === true);
}

export async function rstOfflineGetStatus() {
  if (!isRestaurantOfflineBridge()) {
    return { bootstrapReady: false, runtimeStarted: false, hasAuthSession: false };
  }
  return desk().rstOfflineGetStatus();
}

export async function rstOfflineSetSession(patch) {
  if (!isRestaurantOfflineBridge()) return null;
  return desk().rstOfflineSetSession(patch || {});
}

export async function rstOfflineImportBootstrap(payload) {
  if (!isRestaurantOfflineBridge()) return { ok: false };
  return desk().rstOfflineImportBootstrap(payload);
}

export async function rstOfflineSendToKitchen(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineSendToKitchen(payload);
}

export async function rstOfflineOpenOrder(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineOpenOrder(payload);
}

export async function rstOfflineAddItem(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineAddItem(payload);
}

export async function rstOfflineUpdateItem(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineUpdateItem(payload);
}

export async function rstOfflineCancelItem(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineCancelItem(payload);
}

export async function rstOfflineCancelOrder(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineCancelOrder(payload);
}

export async function rstOfflinePayOrder(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflinePayOrder(payload);
}

export async function rstOfflineResolvePrintJob(payload) {
  if (!isRestaurantOfflineBridge()) {
    throw new Error('rst_offline_bridge_unavailable');
  }
  return desk().rstOfflineResolvePrintJob(payload);
}

export async function rstOfflineGetOrder(orderId) {
  if (!isRestaurantOfflineBridge()) return null;
  return desk().rstOfflineGetOrder(orderId);
}

export async function rstOfflineStartRuntime() {
  if (!isRestaurantOfflineBridge()) return { ok: false };
  return desk().rstOfflineStartRuntime();
}
