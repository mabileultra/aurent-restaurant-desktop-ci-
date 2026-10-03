import { describe, expect, it } from 'vitest';
import { mergeLocalOrdersIntoFloor } from '../../../../src/restaurant/pos/utils/mergeLocalOrdersIntoFloor';

describe('mergeLocalOrdersIntoFloor', () => {
  it('marks free table occupied from local waiter order', () => {
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
    }]);
    expect(merged.halls[0].tables[0].status).toBe('OCCUPIED');
    expect(merged.halls[0].tables[0].activeOrder.id).toBe('L-1');
  });
});
