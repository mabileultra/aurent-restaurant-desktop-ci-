export function resolveDashboardQuickActions(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'WAITER') {
    return [
      { key: 'newOrder', to: '/rst/pos' },
      { key: 'floor', to: '/rst/pos' },
      { key: 'myOrders', to: '/rst/pos' },
    ];
  }
  if (r === 'CASHIER') {
    return [
      { key: 'pos', to: '/rst/cashier' },
      { key: 'reports', to: '/rst/admin/reports' },
    ];
  }
  if (r === 'MANAGER') {
    return [
      { key: 'pos', to: '/rst/cashier' },
      { key: 'floor', to: '/rst/pos' },
      { key: 'kitchen', to: '/rst/kitchen' },
      { key: 'reports', to: '/rst/admin/reports' },
      { key: 'receipt', to: '/rst/admin/stock/receipts/new' },
    ];
  }
  // ADMIN / owner
  return [
    { key: 'pos', to: '/rst/cashier' },
    { key: 'floor', to: '/rst/pos' },
    { key: 'newOrder', to: '/rst/cashier' },
    { key: 'receipt', to: '/rst/admin/stock/receipts/new' },
    { key: 'kitchen', to: '/rst/kitchen' },
  ];
}
