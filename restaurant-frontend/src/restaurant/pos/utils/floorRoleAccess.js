/** Role capabilities for floor ops vs hall configuration. */

export function resolveFloorAccess(role) {
  const r = String(role || '').toUpperCase();
  const isAdmin = r === 'ADMIN' || r === 'MANAGER';
  const isWaiter = r === 'WAITER';
  const isCashier = r === 'CASHIER';

  return {
    role: r,
    canConfigureHall: isAdmin,
    canViewFloor: isAdmin || isWaiter || isCashier,
    canOpenOrder: isAdmin || isWaiter || isCashier,
    canTransferMerge: isAdmin,
    canAssignWaiter: isAdmin || isWaiter,
    canCreateBooking: isAdmin || isWaiter,
    canManageBooking: isAdmin || isWaiter,
    canViewBooking: isAdmin || isWaiter || isCashier,
    /** Counter takeaway/delivery sales — cashier/admin only. */
    canCounterSales: isAdmin || isCashier,
    /** Take payment — cashier/admin. Waiter only requests bill / prints check. */
    canPay: isAdmin || isCashier,
    canCancelOrder: isAdmin,
  };
}
