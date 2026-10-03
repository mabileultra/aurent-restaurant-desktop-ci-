import { describe, expect, it } from 'vitest';
import {
  mergeHubFloorOccupancy,
  mergeLocalOrdersIntoFloor,
  orderSubtotal,
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

  it('computes subtotal from lineTotal or unitPrice×qty', () => {
    expect(orderSubtotal({
      items: [
        { quantity: 2, unitPrice: 1000, status: 'OPEN' },
        { lineTotal: 5000, status: 'SENT' },
        { quantity: 1, unitPrice: 999, status: 'CANCELLED' },
      ],
    })).toBe(7000);
  });
});

describe('mergeHubFloorOccupancy (cashier ↔ waiter / phone ↔ hub)', () => {
  it('paints hub occupied tables onto free server floor (phone sees cashier opens)', () => {
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
          activeOrder: { id: 'local-c1', status: 'OPEN', guestCount: 2, subtotal: 12000 },
          activeOrders: [{ id: 'local-c1', status: 'OPEN', guestCount: 2, subtotal: 12000 }],
        }],
      }],
    };
    const merged = mergeHubFloorOccupancy(server, hub);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('local-c1');
  });

  it('paints server waiter opens onto free cashier SQLite floor', () => {
    const localCashier = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [
          { id: 3, code: '3', status: 'FREE', activeOrders: [] },
          { id: 4, code: '4', status: 'OCCUPIED', activeOrder: { id: 'cash-1' }, activeOrders: [{ id: 'cash-1' }] },
        ],
      }],
    };
    const server = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [
          {
            id: 3,
            status: 'OCCUPIED',
            activeOrder: { id: 'waiter-L', status: 'OPEN', subtotal: 45000 },
            activeOrders: [{ id: 'waiter-L', status: 'OPEN', subtotal: 45000 }],
          },
          { id: 4, status: 'OCCUPIED', activeOrder: { id: 'cash-1' }, activeOrders: [{ id: 'cash-1' }] },
        ],
      }],
    };
    const merged = mergeHubFloorOccupancy(localCashier, server);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('waiter-L');
    expect(merged.halls[0].tables[1].activeOrder.id).toBe('cash-1');
  });

  it('appends hub extra checks without dropping server primary', () => {
    const base = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{
          id: 8,
          status: 'OCCUPIED',
          activeOrder: { id: 's1', status: 'OPEN' },
          activeOrders: [{ id: 's1', status: 'OPEN' }],
        }],
      }],
    };
    const hub = {
      halls: [{
        id: 1,
        tables: [{
          id: 8,
          status: 'OCCUPIED',
          activeOrders: [
            { id: 's1', status: 'OPEN' },
            { id: 'hub-extra', status: 'OPEN', subtotal: 1000 },
          ],
        }],
      }],
    };
    const merged = mergeHubFloorOccupancy(base, hub);
    expect(merged.halls[0].tables[0].activeOrders.map((o) => o.id)).toEqual(['s1', 'hub-extra']);
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('s1');
  });

  it('full phone path: server free + hub busy + rich local dish ticket', () => {
    const server = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{ id: 2, status: 'FREE', activeOrders: [] }],
      }],
    };
    const hub = {
      halls: [{
        id: 1,
        tables: [{
          id: 2,
          status: 'OCCUPIED',
          activeOrder: { id: 'cash-open', status: 'OPEN', subtotal: 0 },
          activeOrders: [{ id: 'cash-open', status: 'OPEN', subtotal: 0 }],
        }],
      }],
    };
    const withHub = mergeHubFloorOccupancy(server, hub);
    const withLocal = mergeLocalOrdersIntoFloor(withHub, [{
      id: 'L-phone',
      tableId: 2,
      status: 'ACTIVE',
      items: [{ id: 'i1', name: 'Choy', quantity: 2, unitPrice: 5000, status: 'SENT' }],
    }]);
    expect(withLocal.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(withLocal.halls[0].tables[0].activeOrder.id).toBe('L-phone');
    expect(withLocal.halls[0].tables[0].activeOrder.subtotal).toBe(10000);
    expect(withLocal.halls[0].tables[0].activeOrders.map((o) => o.id)).toEqual(['L-phone', 'cash-open']);
  });
});
