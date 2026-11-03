/** Instant sync: kitchen window → TV ready-display (same PC / same origin). */

export const KITCHEN_TV_SYNC_CHANNEL = 'rst-kitchen-tv-sync';
export const KITCHEN_TV_SYNC_STORAGE_KEY = 'rst-kitchen-tv-sync-v1';

export function publishKitchenTvBump(storeId) {
  if (storeId == null) return;
  const payload = { storeId: String(storeId), at: Date.now() };
  try {
    localStorage.setItem(KITCHEN_TV_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(KITCHEN_TV_SYNC_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {
    /* ignore */
  }
}

/** @returns {() => void} unsubscribe */
export function subscribeKitchenTvBump(storeId, onBump) {
  if (storeId == null || typeof onBump !== 'function') return () => {};

  const want = String(storeId);
  const handle = (payload) => {
    if (!payload || String(payload.storeId) !== want) return;
    onBump(payload);
  };

  let channel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(KITCHEN_TV_SYNC_CHANNEL);
      channel.onmessage = (event) => handle(event.data);
    }
  } catch {
    channel = null;
  }

  const onStorage = (event) => {
    if (event.key !== KITCHEN_TV_SYNC_STORAGE_KEY || !event.newValue) return;
    try {
      handle(JSON.parse(event.newValue));
    } catch {
      /* ignore */
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
    try {
      channel?.close();
    } catch {
      /* ignore */
    }
  };
}
