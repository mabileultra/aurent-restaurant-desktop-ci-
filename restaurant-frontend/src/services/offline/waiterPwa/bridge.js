/**
 * Waiter PWA local-first bridge — IndexedDB when not on Electron desktop LF.
 */

import { useAuthStore } from '../../../store/authStore';
import {
  waiterOpenOrder,
  waiterAddItem,
  waiterUpdateItem,
  waiterCancelItem,
  waiterCancelOrder,
  waiterPayOrder,
  waiterSendToKitchen,
  waiterGetOrder,
  waiterListOpenOrders,
} from './commands';
import { tickWaiterOutbox, countPendingOutbox } from './outboxSync';
import { pullHubOrdersForWaiter } from './hubOrderImport';
import { idbPut } from './idb';
import { isRestaurantLocalFirstKilled } from '../restaurantLocalFirstKillSwitch';

/** @type {{ storeId: number|null, authToken: string|null }} */
const session = { storeId: null, authToken: null };
let syncTimer = null;
let lastHubPullAt = 0;
const HUB_PULL_MS = 5_000;

export function isWaiterPwaLocalFirstEligible() {
  // Production kill switch — waiters stay on classic online API.
  if (isRestaurantLocalFirstKilled()) return false;
  if (typeof window === 'undefined') return false;
  const desk = window.desktopCashier;
  const deskLf = typeof desk?.restaurantLocalFirstFlag === 'function'
    ? desk.restaurantLocalFirstFlag()
    : desk?.restaurantLocalFirst;
  if (desk?.isDesktop && deskLf === true) {
    return false;
  }
  if (typeof indexedDB === 'undefined') return false;
  const role = useAuthStore.getState()?.user?.role;
  return role === 'WAITER';
}

export function startWaiterPwaSyncLoop() {
  if (syncTimer || !isWaiterPwaLocalFirstEligible()) return;
  const tick = () => {
    if (!isWaiterPwaLocalFirstEligible()) return;
    const storeId = session.storeId;
    if (storeId == null) return;
    void tickWaiterOutbox({ storeId }).catch(() => null);
    // Pull cashier SQLite tickets into phone IDB (and auto-discover hub URL).
    const now = Date.now();
    if (now - lastHubPullAt >= HUB_PULL_MS) {
      lastHubPullAt = now;
      void pullHubOrdersForWaiter({ storeId }).catch(() => null);
    }
  };
  syncTimer = setInterval(tick, 4_000);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', tick);
  }
  tick();
}

export function stopWaiterPwaSyncLoop() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
}

export async function waiterPwaSetSession(patch = {}) {
  if (patch.storeId !== undefined) {
    session.storeId = patch.storeId == null ? null : Number(patch.storeId);
  }
  if (patch.authToken !== undefined) {
    session.authToken = patch.authToken || null;
  }
  startWaiterPwaSyncLoop();
  return { ...session, authToken: session.authToken ? '***' : null };
}

export async function waiterPwaGetStatus() {
  const pending = await countPendingOutbox().catch(() => 0);
  return {
    bootstrapReady: true,
    runtimeStarted: Boolean(syncTimer),
    hasAuthSession: Boolean(session.authToken || useAuthStore.getState()?.token),
    pendingOutbox: pending,
    waiterPwa: true,
  };
}

export async function waiterPwaImportBootstrap(payload = {}) {
  await idbPut('meta', {
    key: 'bootstrap',
    value: {
      storeId: payload.storeId,
      at: new Date().toISOString(),
      categories: payload.categories?.length || 0,
      menuItems: payload.menuItems?.length || 0,
    },
  }).catch(() => null);
  return { ok: true };
}

export async function waiterGetOrderWithHub(orderId, storeId) {
  const local = await waiterGetOrder(orderId);
  if (local) return local;
  try {
    const { importHubOrderById } = await import('./hubOrderImport');
    const row = await importHubOrderById(orderId, storeId ?? session.storeId);
    if (!row) return null;
    return waiterGetOrder(orderId);
  } catch {
    return null;
  }
}

export const waiterPwaBridge = {
  openOrder: waiterOpenOrder,
  addItem: waiterAddItem,
  updateItem: waiterUpdateItem,
  cancelItem: waiterCancelItem,
  cancelOrder: waiterCancelOrder,
  payOrder: waiterPayOrder,
  sendToKitchen: waiterSendToKitchen,
  getOrder: waiterGetOrder,
  getOrderWithHub: waiterGetOrderWithHub,
  listOpenOrders: waiterListOpenOrders,
  getStatus: waiterPwaGetStatus,
  setSession: waiterPwaSetSession,
  importBootstrap: waiterPwaImportBootstrap,
  pullHubOrders: pullHubOrdersForWaiter,
  startRuntime: async () => {
    startWaiterPwaSyncLoop();
    return { ok: true };
  },
};
