import { describe, expect, it } from 'vitest';
import { mergeLocalOrdersIntoFloor } from '../../../../src/restaurant/pos/utils/mergeLocalOrdersIntoFloor';

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
      items: [{ id: 'i1', name: 'Plov', quantity: 1, status: 'OPEN' }],
    }]);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('L-1');
    expect(merged.halls[0].tables[0].activeOrder._local).toBe(true);
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

  it('keeps server check primary over local ghost', () => {
    const snap = {
      storeId: 1,
      halls: [{
        id: 1,
        tables: [{
          id: 6,
          status: 'OCCUPIED',
          activeOrder: { id: 'server-1', status: 'OPEN' },
          activeOrders: [{ id: 'server-1', status: 'OPEN' }],
        }],
      }],
    };
    const merged = mergeLocalOrdersIntoFloor(snap, [{
      id: 'L-ghost',
      tableId: 6,
      status: 'ACTIVE',
      items: [{ id: 'i1', name: 'X', quantity: 1 }],
    }]);
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('server-1');
    expect(merged.halls[0].tables[0].activeOrders.map((o) => o.id)).toEqual(['server-1', 'L-ghost']);
  });
});
