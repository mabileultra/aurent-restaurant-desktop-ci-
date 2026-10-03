import { describe, expect, it } from 'vitest';
import {
  mergeHubFloorOccupancy,
  mergeLocalOrdersIntoFloor,
} from '../../../../src/restaurant/pos/utils/mergeLocalOrdersIntoFloor';

describe('mergeLocalOrdersIntoFloor', () => {
  it('marks free table occupied from local waiter order with lines', () => {
    const snap = {
      storeId: 1,
      halls: [{
        id: 1,
        name: 'Zal',
        tables: [{ id: 6, code: 'STOL 6', status: 'FREE', activeOrders: [] }],
      }],
    };
    const merged = mergeLocalOrdersIntoFloor(snap, [{
      id: 'L-1',
      tableId: 6,
      status: 'ACTIVE',
      guestCount: 1,
      openedAt: '2026-10-03T10:00:00.000Z',
      items: [{ id: 'i1', name: 'Plov', quantity: 1, unitPrice: 30000, status: 'OPEN' }],
    }]);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('L-1');
    expect(merged.halls[0].tables[0].activeOrder._local).toBe(true);
    expect(merged.halls[0].tables[0].activeOrder.subtotal).toBe(30000);
  });

  it('does not paint empty OPEN shells as occupied', () => {
    const snap = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{ id: 6, code: 'STOL 6', status: 'FREE', activeOrders: [] }],
      }],
    };
    const merged = mergeLocalOrdersIntoFloor(snap, [{
      id: 'L-empty',
      tableId: 6,
      status: 'OPEN',
      items: [],
    }]);
    expect(merged.halls[0].tables[0].status).toBe('FREE');
  });

  it('prefers local check with dishes over empty server shell (0 ₽)', () => {
    const snap = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{
          id: 6,
          status: 'OCCUPIED',
          activeOrder: { id: 'server-1', status: 'OPEN', subtotal: 0 },
          activeOrders: [{ id: 'server-1', status: 'OPEN', subtotal: 0 }],
        }],
      }],
    };
    const merged = mergeLocalOrdersIntoFloor(snap, [{
      id: 'L-real',
      tableId: 6,
      status: 'ACTIVE',
      items: [{ id: 'i1', name: 'Salat', quantity: 1, unitPrice: 25000 }],
    }]);
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('L-real');
    expect(merged.halls[0].tables[0].activeOrder.subtotal).toBe(25000);
    expect(merged.halls[0].tables[0].activeOrders.map((o) => o.id)).toEqual(['L-real', 'server-1']);
  });

  it('paints hub occupied tables onto free server floor', () => {
    const server = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{ id: 6, code: 'STOL 6', status: 'FREE', activeOrders: [] }],
      }],
    };
    const hub = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{
          id: 6,
          status: 'OCCUPIED',
          activeOrder: { id: 'local-c1', status: 'OPEN', guestCount: 2 },
          activeOrders: [{ id: 'local-c1', status: 'OPEN', guestCount: 2 }],
        }],
      }],
    };
    const merged = mergeHubFloorOccupancy(server, hub);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('local-c1');
  });
});
