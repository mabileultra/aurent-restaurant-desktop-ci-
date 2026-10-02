/**
 * Cashier POS navigation (header hamburger lookup).
 * Default `hall` = 3-column floor (halls | tables | current order).
 * Paid / returns stay as top-bar quick buttons.
 */

export const CASHIER_TABS = [
  { key: 'hall', labelKey: 'rst.cashier.tabHall' },
  { key: 'sales', labelKey: 'rst.cashier.tabSales' },
  { key: 'orders', labelKey: 'rst.cashier.tabOrders' },
  { key: 'bookings', labelKey: 'rst.cashier.tabBookings' },
  { key: 'payment', labelKey: 'rst.cashier.tabPayment' },
  { key: 'discount', labelKey: 'rst.order.discount' },
  { key: 'shift', labelKey: 'rst.cashier.tabShift' },
];

export const CASHIER_HEADER_TABS = [
  { key: 'paid', labelKey: 'rst.cashier.tabPaidReceipts' },
  { key: 'returns', labelKey: 'rst.cashier.tabReturns' },
];

export function usesCashierPos(role) {
  const r = String(role || '').toUpperCase();
  return r === 'CASHIER' || r === 'ADMIN' || r === 'MANAGER';
}

export function isCashierHallTab(tab) {
  return !tab || tab === 'hall';
}
