/** Сигнал «склад/приход изменил каталог» — другие вкладки кассы и desktop SQLite. */

export const PHARMACY_CATALOG_CHANGED_KEY = 'pharmacy-catalog-changed';
export const PHARMACY_CATALOG_CHANGED_CHANNEL = 'pharmacy-catalog-changed';

/**
 * @param {{ storeId?: number|null, reason?: string }} [payload]
 */
export function notifyPharmacyCatalogChanged(payload = {}) {
  const detail = {
    storeId: payload.storeId ?? null,
    reason: payload.reason || 'stock',
    at: Date.now(),
  };
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(PHARMACY_CATALOG_CHANGED_KEY, JSON.stringify(detail));
  } catch {
    /* ignore quota / private mode */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(PHARMACY_CATALOG_CHANGED_CHANNEL);
      channel.postMessage(detail);
      channel.close();
    }
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(PHARMACY_CATALOG_CHANGED_CHANNEL, { detail }));
  } catch {
    /* ignore */
  }
}

/**
 * @param {(detail: { storeId: number|null, reason: string, at: number }) => void} onChange
 * @returns {() => void}
 */
export function subscribePharmacyCatalogChanged(onChange) {
  if (typeof onChange !== 'function' || typeof window === 'undefined') return () => {};

  const handleStorage = (event) => {
    if (event.key !== PHARMACY_CATALOG_CHANGED_KEY || !event.newValue) return;
    try {
      onChange(JSON.parse(event.newValue));
    } catch {
      /* ignore */
    }
  };

  const handleCustom = (event) => {
    if (event?.detail) onChange(event.detail);
  };

  let channel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(PHARMACY_CATALOG_CHANGED_CHANNEL);
      channel.onmessage = (event) => {
        if (event?.data) onChange(event.data);
      };
    }
  } catch {
    channel = null;
  }

  window.addEventListener('storage', handleStorage);
  window.addEventListener(PHARMACY_CATALOG_CHANGED_CHANNEL, handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PHARMACY_CATALOG_CHANGED_CHANNEL, handleCustom);
    try {
      channel?.close();
    } catch {
      /* ignore */
    }
  };
}
