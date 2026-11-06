/**
 * Store setting allowForeignTableOrders=false → WAITER may mutate only own waiterUserId orders.
 * Managers / cashiers / admins always may.
 */
export function canWaiterMutateOrder({
  role,
  userId,
  orderWaiterUserId,
  allowForeignTableOrders = true,
} = {}) {
  if (String(role || '').toUpperCase() !== 'WAITER') return true;
  if (allowForeignTableOrders !== false) return true;
  if (orderWaiterUserId == null || orderWaiterUserId === '') return true;
  if (userId == null || userId === '') return false;
  return String(orderWaiterUserId) === String(userId);
}
