/** Restaurant local-first bridge: Electron IPC or waiter PWA IndexedDB. */

import {
  isWaiterPwaLocalFirstEligible,
  waiterPwaBridge,
} from './waiterPwa/bridge';
import { mergeLocalOrdersIntoFloor } from '../../restaurant/pos/utils/mergeLocalOrdersIntoFloor';

function desk() {
  return typeof window !== 'undefined' ? window.desktopCashier : null;
}

export function isRestaurantOfflineBridge() {
  if (isElectronOfflineBridge()) return true;
  return isWaiterPwaLocalFirstEligible();
}

function isElectronOfflineBridge() {
  const d = desk();
  return Boolean(d?.isDesktop && typeof d.rstOfflineGetStatus === 'function');
}

export function isRestaurantLocalFirstDesktop() {
  const d = desk();
  if (typeof d?.restaurantLocalFirstFlag === 'function') {
    return Boolean(d.restaurantLocalFirstFlag());
  }
  return Boolean(d?.restaurantLocalFirst === true);
}

/** Active local-first path (desktop flag OR waiter PWA). */
export function isRestaurantLocalFirstOn() {
  if (isRestaurantLocalFirstDesktop() && isElectronOfflineBridge()) return true;
  return isWaiterPwaLocalFirstEligible();
}

function usePwa() {
  return !isElectronOfflineBridge() && isWaiterPwaLocalFirstEligible();
}

export async function rstOfflineGetStatus() {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetStatus();
  if (usePwa()) return waiterPwaBridge.getStatus();
  return { bootstrapReady: false, runtimeStarted: false, hasAuthSession: false };
}

export async function rstOfflineSetSession(patch) {
  if (isElectronOfflineBridge()) return desk().rstOfflineSetSession(patch || {});
  if (usePwa()) return waiterPwaBridge.setSession(patch || {});
  return null;
}

export async function rstOfflineImportBootstrap(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineImportBootstrap(payload);
  if (usePwa()) return waiterPwaBridge.importBootstrap(payload || {});
  return { ok: false };
}

export async function rstOfflineSendToKitchen(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineSendToKitchen(payload);
  if (usePwa()) return waiterPwaBridge.sendToKitchen(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineOpenOrder(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineOpenOrder(payload);
  if (usePwa()) return waiterPwaBridge.openOrder(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineAddItem(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineAddItem(payload);
  if (usePwa()) return waiterPwaBridge.addItem(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineUpdateItem(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineUpdateItem(payload);
  if (usePwa()) return waiterPwaBridge.updateItem(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineCancelItem(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineCancelItem(payload);
  if (usePwa()) return waiterPwaBridge.cancelItem(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineCancelOrder(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineCancelOrder(payload);
  if (usePwa()) return waiterPwaBridge.cancelOrder(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflinePayOrder(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflinePayOrder(payload);
  if (usePwa()) return waiterPwaBridge.payOrder(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineRequestBill(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineRequestBill(payload);
  if (usePwa()) {
    // PWA: mark BILLING in IDB if we add it later; for now throw so FE can fall back.
    throw new Error('rst_offline_bridge_unavailable');
  }
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineListMenu(storeId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineListMenu(storeId);
  return [];
}

export async function rstOfflineListCategories(storeId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineListCategories(storeId);
  return [];
}

export async function rstOfflineListRoster(storeId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineListRoster(storeId);
  return [];
}

export async function rstOfflineSaveModifiers(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineSaveModifiers(payload || {});
  return { ok: false };
}

export async function rstOfflineGetModifiers(menuItemId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetModifiers(menuItemId);
  return [];
}

export async function rstOfflineGetFloor(storeId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetFloor(storeId);
  return { storeId: null, halls: [] };
}

/** Merge waiter IDB open checks onto server/hub floor (satellite phone). */
export async function rstOfflineOverlayFloor(storeId, snapshot) {
  if (!usePwa() || !snapshot?.halls?.length) return snapshot;
  const locals = await waiterPwaBridge.listOpenOrders(storeId).catch(() => []);
  return mergeLocalOrdersIntoFloor(snapshot, locals);
}

export async function rstOfflinePatchOrderMeta(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflinePatchOrderMeta(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineSaveShift(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineSaveShift(payload || {});
  return { ok: false };
}

export async function rstOfflineGetShift(storeId) {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetShift(storeId);
  return null;
}

export async function rstOfflineOpenShift(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineOpenShift(payload || {});
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineCloseShift(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineCloseShift(payload || {});
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineGetHubInfo() {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetHubInfo();
  return { listening: false, url: null };
}

export async function rstOfflineCreateMenuItem(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineCreateMenuItem(payload || {});
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflinePullHubSnapshot(hubUrl) {
  if (isElectronOfflineBridge()) return desk().rstOfflinePullHubSnapshot(hubUrl);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineResolvePrintJob(payload) {
  if (isElectronOfflineBridge()) return desk().rstOfflineResolvePrintJob(payload);
  throw new Error('rst_offline_bridge_unavailable');
}

export async function rstOfflineGetOrder(orderId, opts = {}) {
  if (isElectronOfflineBridge()) return desk().rstOfflineGetOrder(orderId);
  if (usePwa()) {
    // Fall back to LAN hub (касса SQLite) when the ticket was opened on monoblock.
    if (typeof waiterPwaBridge.getOrderWithHub === 'function') {
      return waiterPwaBridge.getOrderWithHub(orderId, opts.storeId);
    }
    return waiterPwaBridge.getOrder(orderId);
  }
  return null;
}

export async function rstOfflineStartRuntime() {
  if (isElectronOfflineBridge()) return desk().rstOfflineStartRuntime();
  if (usePwa()) return waiterPwaBridge.startRuntime();
  return { ok: false };
}
