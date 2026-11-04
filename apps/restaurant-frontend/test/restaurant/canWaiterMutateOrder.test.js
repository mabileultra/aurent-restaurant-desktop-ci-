import { describe, expect, it } from 'vitest';
import { canWaiterMutateOrder } from '../../src/restaurant/pos/utils/canWaiterMutateOrder.js';

describe('canWaiterMutateOrder', () => {
  it('allows manager always', () => {
    expect(canWaiterMutateOrder({
      role: 'MANAGER',
      userId: '1',
      orderWaiterUserId: '2',
      allowForeignTableOrders: false,
    })).toBe(true);
  });

  it('allows waiter on own order when foreign disabled', () => {
    expect(canWaiterMutateOrder({
      role: 'WAITER',
      userId: 'a',
      orderWaiterUserId: 'a',
      allowForeignTableOrders: false,
    })).toBe(true);
  });

  it('blocks waiter on foreign order when foreign disabled', () => {
    expect(canWaiterMutateOrder({
      role: 'WAITER',
      userId: 'a',
      orderWaiterUserId: 'b',
      allowForeignTableOrders: false,
    })).toBe(false);
  });

  it('allows waiter on foreign order when foreign enabled', () => {
    expect(canWaiterMutateOrder({
      role: 'WAITER',
      userId: 'a',
      orderWaiterUserId: 'b',
      allowForeignTableOrders: true,
    })).toBe(true);
  });
});
