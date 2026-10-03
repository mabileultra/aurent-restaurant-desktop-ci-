import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../../src/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { role: 'WAITER' }, token: 't' }),
  },
}));

vi.mock('../../../src/api/client', () => ({
  api: { post: vi.fn() },
}));

import { waiterOpenOrder, waiterAddItem, waiterGetOrder, waiterSendToKitchen } from '../../../src/services/offline/waiterPwa/commands';

/** Minimal in-memory IDB stub for node tests. */
function installMemoryIdb() {
  const stores = new Map();
  const ensure = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  globalThis.indexedDB = {
    open: () => {
      const req = {
        result: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      Promise.resolve().then(() => {
        const db = {
          objectStoreNames: { contains: (n) => stores.has(n) },
          createObjectStore: (n) => {
            ensure(n);
            return { createIndex: () => {} };
          },
          transaction: (storeNames) => {
            const names = Array.isArray(storeNames) ? storeNames : [storeNames];
            names.forEach(ensure);
            const tx = {
              objectStore: (n) => ({
                get: (key) => {
                  const r = { result: ensure(n).get(key), onsuccess: null, onerror: null };
                  Promise.resolve().then(() => r.onsuccess && r.onsuccess());
                  return r;
                },
                put: (val) => {
                  ensure(n).set(val.id ?? val.key, val);
                },
                delete: (key) => {
                  ensure(n).delete(key);
                },
                getAll: () => {
                  const r = { result: [...ensure(n).values()], onsuccess: null, onerror: null };
                  Promise.resolve().then(() => r.onsuccess && r.onsuccess());
                  return r;
                },
              }),
              oncomplete: null,
              onerror: null,
              onabort: null,
            };
            Promise.resolve().then(() => tx.oncomplete && tx.oncomplete());
            return tx;
          },
        };
        ensure('orders');
        ensure('outbox');
        ensure('meta');
        req.result = db;
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
  if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto = {
      ...(globalThis.crypto || {}),
      randomUUID: () => `uuid-${Math.random().toString(16).slice(2)}`,
    };
  }
}

describe('waiter PWA local commands', () => {
  beforeEach(() => {
    installMemoryIdb();
  });

  it('open + add + send without WAN', async () => {
    const opened = await waiterOpenOrder({
      storeId: 1,
      tableId: 7,
      tableLabel: 'A1',
      guestCount: 2,
      waiterId: 'w1',
    });
    expect(opened.orderId).toBeTruthy();
    expect(opened.order.status).toBe('OPEN');

    const added = await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'Plov',
      quantity: 1,
      unitPrice: 30000,
      menuItemId: 'm1',
    });
    expect(added.order.items).toHaveLength(1);
    expect(added.order.items[0].itemStatus).toBe('NEW');

    const sent = await waiterSendToKitchen({
      orderId: opened.orderId,
      storeId: 1,
      tableId: 7,
      items: [{ name: 'Plov', qty: 1 }],
    });
    expect(sent.printOk).toBe(false);
    const again = await waiterGetOrder(opened.orderId);
    expect(again.items[0].itemStatus).toBe('SENT_TO_KITCHEN');
  });
});
