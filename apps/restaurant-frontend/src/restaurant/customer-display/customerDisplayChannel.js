/** Local sync between cashier window and guest display on the same PC. */

export const CUSTOMER_DISPLAY_CHANNEL = 'rst-customer-display';
export const CUSTOMER_DISPLAY_STORAGE_KEY = 'rst-customer-display-v1';

export const CFD_PHASE = Object.freeze({
  IDLE: 'idle',
  ACTIVE: 'active',
  PAYING: 'paying',
  THANKS: 'thanks',
});

export function idleSnapshot(storeName = '') {
  return {
    phase: CFD_PHASE.IDLE,
    storeName: String(storeName || ''),
    orderNo: null,
    lines: [],
    subtotal: 0,
    discountAmount: 0,
    serviceAmount: 0,
    total: 0,
    updatedAt: Date.now(),
  };
}

export function publishCustomerDisplay(snapshot) {
  const payload = {
    ...idleSnapshot(snapshot?.storeName),
    ...(snapshot || {}),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(CUSTOMER_DISPLAY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {
    /* ignore */
  }
  return payload;
}

export function readCustomerDisplaySnapshot() {
  try {
    const raw = localStorage.getItem(CUSTOMER_DISPLAY_STORAGE_KEY);
    if (!raw) return idleSnapshot();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return idleSnapshot();
    return { ...idleSnapshot(parsed.storeName), ...parsed };
  } catch {
    return idleSnapshot();
  }
}
