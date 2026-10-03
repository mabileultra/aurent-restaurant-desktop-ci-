import { beforeEach, describe, expect, it, vi } from 'vitest';

const idbState = { outbox: [] };

vi.mock('../../../src/api/client', () => ({
  api: { post: vi.fn() },
}));

vi.mock('../../../src/services/offline/waiterPwa/idb', () => ({
  idbGetAll: vi.fn(async (store) => (store === 'outbox' ? [...idbState.outbox] : [])),
  idbPut: vi.fn(async (store, row) => {
    if (store !== 'outbox') return;
    const i = idbState.outbox.findIndex((r) => r.id === row.id);
    if (i >= 0) idbState.outbox[i] = row;
    else idbState.outbox.push(row);
  }),
}));

import { api } from '../../../src/api/client';
import {
  deliverWaiterOutboxEvent,
  setConfiguredHubUrl,
  tickWaiterOutbox,
} from '../../../src/services/offline/waiterPwa/outboxSync';

describe('waiter outbox hub-first deliver', () => {
  beforeEach(() => {
    idbState.outbox = [];
    vi.clearAllMocks();
    setConfiguredHubUrl('');
    globalThis.fetch = vi.fn();
    globalThis.localStorage = {
      _m: new Map(),
      getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
      setItem(k, v) { this._m.set(k, String(v)); },
      removeItem(k) { this._m.delete(k); },
    };
  });

  it('posts hub before cloud when hub URL is set', async () => {
    const order = [];
    globalThis.fetch.mockImplementation(async (url) => {
      order.push(`hub:${url}`);
      return {
        ok: true,
        json: async () => ({ outcome: 'ACCEPTED' }),
        text: async () => '',
      };
    });
    api.post.mockImplementation(async () => {
      order.push('cloud');
      return { data: { outcome: 'ACCEPTED' } };
    });

    const outcome = await deliverWaiterOutboxEvent({
      storeId: 1,
      hubUrl: 'http://192.168.1.10:8787',
      body: { deviceId: 'w', clientEventId: 'c1', eventType: 'ORDER_ADD_ITEM', payload: {} },
    });

    expect(outcome).toBe('ACCEPTED');
    expect(order[0]).toMatch(/^hub:/);
    expect(order).toContain('cloud');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://192.168.1.10:8787/hub/events',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('strips printOnServer on cloud after hub already accepted kitchen SEND', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ outcome: 'ACCEPTED' }),
      text: async () => '',
    });
    api.post.mockResolvedValue({ data: { outcome: 'ACCEPTED' } });

    await deliverWaiterOutboxEvent({
      storeId: 1,
      hubUrl: 'http://hub:8787',
      body: {
        deviceId: 'w',
        clientEventId: 'send-1',
        eventType: 'ORDER_SEND_KITCHEN',
        payload: { orderId: 'L-1', printOnServer: true, items: [{ name: 'Plov', qty: 1 }] },
      },
    });

    expect(api.post).toHaveBeenCalledWith(
      '/rst/stores/1/local-events',
      expect.objectContaining({
        eventType: 'ORDER_SEND_KITCHEN',
        payload: expect.objectContaining({ printOnServer: false }),
      }),
    );
  });

  it('succeeds via hub when cloud is down', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ outcome: 'ACCEPTED' }),
      text: async () => '',
    });
    api.post.mockRejectedValue(new Error('network'));

    const outcome = await deliverWaiterOutboxEvent({
      storeId: 1,
      hubUrl: 'http://hub:8787',
      body: { deviceId: 'w', clientEventId: 'c2', eventType: 'ORDER_OPEN', payload: {} },
    });
    expect(outcome).toBe('ACCEPTED');
  });

  it('succeeds via cloud when hub is down', async () => {
    globalThis.fetch.mockRejectedValue(new Error('hub offline'));
    api.post.mockResolvedValue({ data: { outcome: 'ACCEPTED' } });

    const outcome = await deliverWaiterOutboxEvent({
      storeId: 1,
      hubUrl: 'http://hub:8787',
      body: { deviceId: 'w', clientEventId: 'c3', eventType: 'ORDER_OPEN', payload: {} },
    });
    expect(outcome).toBe('ACCEPTED');
  });

  it('cloud-only when hub URL empty', async () => {
    api.post.mockResolvedValue({ data: { outcome: 'OK' } });
    const outcome = await deliverWaiterOutboxEvent({
      storeId: 1,
      hubUrl: '',
      body: { deviceId: 'w', clientEventId: 'c4', eventType: 'ORDER_OPEN', payload: {} },
    });
    expect(outcome).toBe('OK');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('tickWaiterOutbox marks PENDING → SYNCED through hub', async () => {
    setConfiguredHubUrl('http://192.168.0.5:8787');
    idbState.outbox = [{
      id: 'ob1',
      deviceId: 'phone',
      clientEventId: 'ev-1',
      eventType: 'ORDER_ADD_ITEM',
      payload: { orderId: 'L-1', name: 'Plov' },
      status: 'PENDING',
      createdAt: '2026-10-03T10:00:00.000Z',
      attemptCount: 0,
    }];
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ outcome: 'ACCEPTED' }),
      text: async () => '',
    });
    api.post.mockResolvedValue({ data: { outcome: 'ACCEPTED' } });

    const res = await tickWaiterOutbox({ storeId: 9 });
    expect(res.busy).toBe(false);
    expect(res.results).toEqual([{ id: 'ob1', status: 'SYNCED', outcome: 'ACCEPTED' }]);
    expect(idbState.outbox[0].status).toBe('SYNCED');
  });

  it('tickWaiterOutbox retries when both hub and cloud fail', async () => {
    setConfiguredHubUrl('http://hub:8787');
    idbState.outbox = [{
      id: 'ob2',
      deviceId: 'phone',
      clientEventId: 'ev-2',
      eventType: 'ORDER_OPEN',
      payload: {},
      status: 'PENDING',
      createdAt: '2026-10-03T10:00:00.000Z',
      attemptCount: 0,
    }];
    globalThis.fetch.mockRejectedValue(new Error('hub down'));
    api.post.mockRejectedValue(new Error('cloud down'));

    const res = await tickWaiterOutbox({ storeId: 9 });
    expect(res.results[0].status).toBe('RETRY');
    expect(idbState.outbox[0].status).toBe('RETRY');
    expect(idbState.outbox[0].attemptCount).toBe(1);
  });
});
