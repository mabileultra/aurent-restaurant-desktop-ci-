import { describe, expect, it } from 'vitest';
import { resolveFloorAccess } from '../../src/restaurant/pos/utils/floorRoleAccess';

describe('resolveFloorAccess', () => {
  it('keeps hall configuration for admin/manager only', () => {
    expect(resolveFloorAccess('ADMIN').canConfigureHall).toBe(true);
    expect(resolveFloorAccess('MANAGER').canConfigureHall).toBe(true);
    expect(resolveFloorAccess('CASHIER').canConfigureHall).toBe(false);
    expect(resolveFloorAccess('WAITER').canConfigureHall).toBe(false);
  });

  it('gives cashier view-only bookings and no transfer/merge', () => {
    const a = resolveFloorAccess('CASHIER');
    expect(a.canViewBooking).toBe(true);
    expect(a.canCreateBooking).toBe(false);
    expect(a.canManageBooking).toBe(false);
    expect(a.canTransferMerge).toBe(false);
    expect(a.canPay).toBe(true);
  });

  it('lets waiter create bookings and open orders without pay or counter sales', () => {
    const a = resolveFloorAccess('WAITER');
    expect(a.canCreateBooking).toBe(true);
    expect(a.canManageBooking).toBe(true);
    expect(a.canOpenOrder).toBe(true);
    expect(a.canConfigureHall).toBe(false);
    expect(a.canPay).toBe(false);
    expect(a.canCounterSales).toBe(false);
    expect(a.canTransferMerge).toBe(false);
  });

  it('lets cashier take payment and counter sales', () => {
    const a = resolveFloorAccess('CASHIER');
    expect(a.canPay).toBe(true);
    expect(a.canCounterSales).toBe(true);
  });

  it('lets manager transfer/merge and configure halls', () => {
    const a = resolveFloorAccess('MANAGER');
    expect(a.canTransferMerge).toBe(true);
    expect(a.canConfigureHall).toBe(true);
    expect(a.canCreateBooking).toBe(true);
  });
});
