import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hubOrderToIdbRow,
  upsertHubOrdersIntoIdb,
} from '../../../src/services/offline/waiterPwa/hubOrderImport';
import { mergeHubFloorOccupancy } from '../../../src/restaurant/pos/utils/mergeLocalOrdersIntoFloor';

const store = new Map();

vi.mock('../../../src/services/offline/waiterPwa/idb', () => ({
  idbGet: vi.fn(async (_s, id) => store.get(String(id)) || null),
  idbPut: vi.fn(async (_s, row) => { store.set(String(row.id), row); }),
}));

describe('hubOrderToIdbRow', () => {
  beforeEach(() => {
    store.clear();
  });

  it('maps cashier hub ticket into waiter IDB shape with sent qty', () => {
    const row = hubOrderToIdbRow({
      id: 'ord-1',
      storeId: 1,
      tableId: 2,
      status: 'OPEN',
      guestCount: 1,
      updatedAt: '2026-10-03T12:00:00.000Z',
      openedAt: '2026-10-03T11:00:00.000Z',
      items: [{
        id: 'i1',
        name: 'CHORTOQ 0.5 L',
        quantity: 3,
        unitPrice: 14000,
        status: 'SENT',
        sentQuantity: 1,
      }],
    }, 1);
    expect(row.id).toBe('ord-1');
    expect(row.tableId).toBe('2');
    expect(row.status).toBe('ACTIVE');
    expect(row.items).toHaveLength(1);
    expect(row.items[0].sentQuantity).toBe(1);
    expect(row.items[0].status).toBe('SENT');
    expect(row.mirrored).toBe(true);
  });

  it('upserts hub order so phone open sees cashier punches', async () => {
    const n = await upsertHubOrdersIntoIdb([{
      id: '370e07ff-2534-4cf5-bb66-4d030a500440',
      storeId: 55,
      tableId: 13,
      status: 'OPEN',
      updatedAt: '2026-10-03T13:50:00.000Z',
      openedAt: '2026-10-03T13:48:00.000Z',
      items: [{
        id: 'i1',
        name: 'CHORTOQ 0.5 L',
        quantity: 5,
        unitPrice: 14000,
        status: 'SENT',
        sentQuantity: 4,
      }],
    }], 55);
    expect(n).toBe(1);
    expect(store.get('370e07ff-2534-4cf5-bb66-4d030a500440').items[0].quantity).toBe(5);
  });

  it('floor merge prefers hub check with money over empty cloud shell', () => {
    const server = {
      storeId: 55,
      halls: [{
        id: 1,
        tables: [{
          id: 13,
          status: 'OCCUPIED',
          activeOrder: { id: 'stale-empty', status: 'OPEN', subtotal: 0 },
          activeOrders: [{ id: 'stale-empty', status: 'OPEN', subtotal: 0 }],
        }],
      }],
    };
    const hub = {
      halls: [{
        id: 1,
        tables: [{
          id: 13,
          status: 'OCCUPIED',
          activeOrders: [{
            id: '370e07ff-2534-4cf5-bb66-4d030a500440',
            status: 'OPEN',
            subtotal: 70000,
          }],
        }],
      }],
    };
    const merged = mergeHubFloorOccupancy(server, hub);
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('370e07ff-2534-4cf5-bb66-4d030a500440');
  });
});
