/** Restaurant SPA handbook — only /rst routes and shared stock handoff keys. */

const ROUTE_MAP = [
  { test: (p) => p.startsWith('/rst/cashier'), id: 'restaurantPos' },
  { test: (p) => p.startsWith('/rst/pos'), id: 'restaurantPos' },
  { test: (p) => p.startsWith('/rst/kitchen'), id: 'restaurantKitchen' },
  { test: (p) => p.startsWith('/rst/admin/booking'), id: 'restaurantBooking' },
  { test: (p) => p.startsWith('/rst/admin/delivery'), id: 'restaurantDelivery' },
  { test: (p) => p.startsWith('/rst/admin/stock'), id: 'stockProducts' },
  { test: (p) => p.startsWith('/rst/admin/menu') || p.startsWith('/rst/admin/catalog'), id: 'products' },
  { test: (p) => p.startsWith('/rst/admin'), id: 'restaurantFloor' },
  { test: (p) => p.startsWith('/rst/'), id: 'restaurantFloor' },
];

export const HANDBOOK_GROUPS = {
  admin: ['restaurant', 'stock', 'settings'],
  cashier: ['cashier'],
};

export const ADMIN_MODULE_IDS = [
  { id: 'restaurantFloor', group: 'restaurant', roles: ['ADMIN', 'MANAGER'] },
  { id: 'restaurantKitchen', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'COOK'] },
  { id: 'restaurantBooking', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { id: 'restaurantDelivery', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { id: 'products', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'categories', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockProducts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockSuppliers', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockReceipts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockInventories', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockLow', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
];

export const CASHIER_MODULE_IDS = [
  { id: 'restaurantPos', group: 'cashier', roles: ['CASHIER', 'WAITER', 'MANAGER', 'ADMIN'] },
  { id: 'restaurantKitchen', group: 'cashier', roles: ['COOK', 'CASHIER', 'WAITER', 'MANAGER', 'ADMIN'] },
];

export function resolveHandbookModuleId(pathname) {
  const hit = ROUTE_MAP.find((r) => r.test(pathname));
  return hit?.id ?? 'restaurantFloor';
}

export function modulesForScope(scope, userRole, allowedModules) {
  const list = scope === 'cashier' ? CASHIER_MODULE_IDS : ADMIN_MODULE_IDS;
  if (Array.isArray(allowedModules) && allowedModules.length > 0) {
    return list.filter((m) => allowedModules.includes(m.id));
  }
  if (!userRole) return list;
  return list.filter((m) => m.roles.includes(userRole));
}
