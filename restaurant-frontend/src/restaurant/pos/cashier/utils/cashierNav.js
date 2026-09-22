/**
 * Cashier POS bottom navigation.
 * Default `hall` = 3-column floor (halls | tables | current order).
 */

export const CASHIER_TABS = [
  { key: 'hall', labelKey: 'rst.cashier.tabHall' },
  { key: 'sales', labelKey: 'rst.cashier.tabSales' },
  { key: 'orders', labelKey: 'rst.cashier.tabOrders' },
  { key: 'bookings', labelKey: 'rst.cashier.tabBookings' },
  { key: 'payment', labelKey: 'rst.cashier.tabPayment' },
  { key: 'returns', labelKey: 'rst.cashier.tabReturns' },
  { key: 'shift', labelKey: 'rst.cashier.tabShift' },
];

export function usesCashierPos(role) {
  const r = String(role || '').toUpperCase();
  return r === 'CASHIER' || r === 'ADMIN' || r === 'MANAGER';
}

export function isCashierHallTab(tab) {
  return !tab || tab === 'hall';
}
