import { describe, expect, it } from 'vitest';
import { groupReadyDisplayOrders } from '../../../src/restaurant/ready-display/utils/groupReadyDisplayOrders';

describe('groupReadyDisplayOrders', () => {
  it('keeps order on cooking while any ticket is still cooking', () => {
    const { cooking, ready } = groupReadyDisplayOrders([
      { id: 1, orderId: 'o1', orderNo: 12, status: 'PREPARING', tableCode: 'A1' },
      { id: 2, orderId: 'o1', orderNo: 12, status: 'READY', tableCode: 'A1' },
    ]);
    expect(cooking.map((r) => r.orderNo)).toEqual([12]);
    expect(ready).toEqual([]);
  });

  it('moves to ready when all tickets are ready and plays as one number', () => {
    const { cooking, ready } = groupReadyDisplayOrders([
      { id: 1, orderId: 'o1', orderNo: 7, status: 'READY' },
      { id: 2, orderId: 'o1', orderNo: 7, status: 'READY' },
      { id: 3, orderId: 'o2', orderNo: 3, status: 'NEW' },
    ]);
    expect(cooking.map((r) => r.orderNo)).toEqual([3]);
    expect(ready.map((r) => r.orderNo)).toEqual([7]);
  });

  it('ignores served and cancelled tickets', () => {
    const { cooking, ready } = groupReadyDisplayOrders([
      { id: 1, orderId: 'o1', orderNo: 9, status: 'SERVED' },
      { id: 2, orderId: 'o2', orderNo: 5, status: 'CANCELLED' },
    ]);
    expect(cooking).toEqual([]);
    expect(ready).toEqual([]);
  });
});
