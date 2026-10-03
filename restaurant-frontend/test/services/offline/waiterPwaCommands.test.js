import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../../src/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { role: 'WAITER' }, token: 't' }),
  },
}));

vi.mock('../../../src/api/client', () => ({
  api: { post: vi.fn() },
}));

import {
  waiterOpenOrder,
  waiterAddItem,
  waiterGetOrder,
  waiterSendToKitchen,
  waiterCancelItem,
} from '../../../src/services/offline/waiterPwa/commands';

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
    expect(sent.printOk).toBe(true);
    expect(sent.printOnServer).toBe(true);
    const again = await waiterGetOrder(opened.orderId);
    expect(again.items[0].itemStatus).toBe('SENT_TO_KITCHEN');
    expect(again.items[0].lineTotal).toBe(30000);
  });

  it('merges same unsent dish into one line', async () => {
    const opened = await waiterOpenOrder({
      storeId: 1,
      tableId: 9,
      tableLabel: 'T9',
      guestCount: 1,
    });
    await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'CHORTOQ 0.7',
      quantity: 1,
      unitPrice: 18000,
      menuItemId: 'm-ch',
    });
    const second = await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'CHORTOQ 0.7',
      quantity: 1,
      unitPrice: 18000,
      menuItemId: 'm-ch',
    });
    expect(second.merged).toBe(true);
    expect(second.order.items).toHaveLength(1);
    expect(second.order.items[0].quantity).toBe(2);
    expect(second.order.items[0].lineTotal).toBe(36000);
  });

  it('ADD outbox carries tableId+storeId so server can materialize if OPEN was skipped', async () => {
    const opened = await waiterOpenOrder({
      storeId: 55,
      tableId: 13,
      tableLabel: 'T13',
      guestCount: 1,
      forceNew: true,
    });
    const added = await waiterAddItem({
      orderId: opened.orderId,
      storeId: 55,
      name: 'CHORTOQ 0.5 L',
      quantity: 1,
      unitPrice: 14000,
      menuItemId: 'm-ch05',
    });
    const { idbGetAll } = await import('../../../src/services/offline/waiterPwa/idb');
    const outbox = await idbGetAll('outbox');
    const add = outbox.find((e) => (
      e.eventType === 'ORDER_ADD_ITEM' && String(e.payload?.orderId) === String(opened.orderId)
    ));
    expect(added.itemId).toBeTruthy();
    expect(add).toBeTruthy();
    expect(String(add.payload.tableId)).toBe('13');
    expect(Number(add.payload.storeId)).toBe(55);
  });

  it('merges same dish onto kitchen line instead of a new row at the bottom', async () => {
    const opened = await waiterOpenOrder({
      storeId: 1,
      tableId: 11,
      tableLabel: 'T11',
      guestCount: 1,
    });
    await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'CHORTOQ 0.5 L',
      quantity: 1,
      unitPrice: 14000,
      menuItemId: 'm-ch05',
    });
    await waiterSendToKitchen({
      orderId: opened.orderId,
      storeId: 1,
      tableId: 11,
      items: [{ name: 'CHORTOQ 0.5 L', qty: 1 }],
    });
    const again = await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'CHORTOQ 0.5 L',
      quantity: 1,
      unitPrice: 14000,
      menuItemId: 'm-ch05',
    });
    expect(again.merged).toBe(true);
    expect(again.order.items).toHaveLength(1);
    expect(again.order.items[0].quantity).toBe(2);
    expect(again.order.items[0].sentQuantity).toBe(1);
    expect(again.order.items[0].itemStatus).toBe('SENT_TO_KITCHEN');
  });

  it('reuses open order on same table instead of stacking empties', async () => {
    const first = await waiterOpenOrder({
      storeId: 1,
      tableId: 12,
      tableLabel: 'T12',
      guestCount: 1,
    });
    const second = await waiterOpenOrder({
      storeId: 1,
      tableId: 12,
      tableLabel: 'T12',
      guestCount: 1,
    });
    expect(second.orderId).toBe(first.orderId);
    expect(second.reused).toBe(true);
    expect(second.outboxId).toBeNull();
  });

  it('forceNew opens a second check on the same table', async () => {
    const first = await waiterOpenOrder({
      storeId: 1,
      tableId: 15,
      tableLabel: 'T15',
      guestCount: 1,
    });
    const second = await waiterOpenOrder({
      storeId: 1,
      tableId: 15,
      tableLabel: 'T15',
      guestCount: 1,
      forceNew: true,
    });
    expect(second.orderId).not.toBe(first.orderId);
    expect(second.reused).toBeFalsy();
  });

  it('removes unsent line from ticket instead of leaving a ghost name', async () => {
    const opened = await waiterOpenOrder({
      storeId: 1,
      tableId: 16,
      guestCount: 1,
    });
    const added = await waiterAddItem({
      orderId: opened.orderId,
      storeId: 1,
      name: 'лагмон',
      quantity: 1,
      unitPrice: 12000,
      menuItemId: 'm-lag',
    });
    const cancelled = await waiterCancelItem({
      orderId: opened.orderId,
      itemId: added.itemId,
    });
    expect(cancelled.deleted).toBe(true);
    expect(cancelled.order.items).toHaveLength(0);
  });
});
