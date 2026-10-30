/** Grouped admin sidebar — mirrors Aurent Restaurant phases. */

export const RST_ADMIN_NAV_GROUPS = [
  {
    key: 'overview',
    items: [
      { to: '/rst/admin/dashboard', key: 'dashboard', enabled: true },
    ],
  },
  {
    key: 'hall',
    items: [
      { to: '/rst/admin/halls', key: 'halls', enabled: true },
      { to: '/rst/admin/booking', key: 'booking', enabled: true },
    ],
  },
  {
    key: 'menuKitchen',
    items: [
      { to: '/rst/admin/menu', key: 'menu', enabled: true },
      { to: '/rst/admin/menu-categories', key: 'menuCategories', enabled: true },
      { to: '/rst/admin/modifiers', key: 'modifiers', enabled: true },
      { to: '/rst/admin/recipes', key: 'recipes', enabled: true },
      { to: '/rst/admin/stations', key: 'stations', enabled: true },
    ],
  },
  {
    key: 'stock',
    items: [
      { to: '/rst/admin/stock', key: 'stockOverview', enabled: true, end: true },
      { to: '/rst/admin/stock/balances', key: 'stockBalances', enabled: true },
      { to: '/rst/admin/stock/receipts', key: 'stockReceipts', enabled: true },
      { to: '/rst/admin/stock/expenses', key: 'stockExpenses', enabled: true },
      { to: '/rst/admin/stock/transfers', key: 'stockTransfers', enabled: true },
      { to: '/rst/admin/stock/production', key: 'stockProduction', enabled: true },
      { to: '/rst/admin/stock/write-offs', key: 'stockWriteOffs', enabled: true },
      { to: '/rst/admin/stock/inventories', key: 'stockInventories', enabled: true },
      { to: '/rst/admin/stock/movements', key: 'stockMovements', enabled: true },
    ],
  },
  {
    key: 'references',
    items: [
      { to: '/rst/admin/stock/products', key: 'stockProducts', enabled: true },
      { to: '/rst/admin/stock/categories', key: 'stockCategories', enabled: true },
      { to: '/rst/admin/stock/suppliers', key: 'stockSuppliers', enabled: true },
    ],
  },
  {
    key: 'staff',
    items: [
      { to: '/rst/admin/staff', key: 'staff', enabled: true },
      { to: '/rst/admin/shifts', key: 'shifts', enabled: true },
    ],
  },
  {
    key: 'ops',
    items: [
      { to: '/rst/admin/delivery', key: 'delivery', enabled: true },
    ],
  },
  {
    key: 'analytics',
    items: [
      { to: '/rst/admin/reports', key: 'reports', enabled: true },
      { to: '/rst/admin/audit', key: 'audit', enabled: true },
    ],
  },
  {
    key: 'system',
    items: [
      { to: '/rst/admin/printers', key: 'printers', enabled: true },
      { to: '/rst/admin/pickup-labels', key: 'pickupLabels', enabled: true, module: 'restaurantPickupLabel' },
      { to: '/rst/admin/stores', key: 'stores', enabled: true, adminOnly: true },
      { to: '/rst/admin/integrations', key: 'integrations', enabled: true, adminOnly: true },
      { to: '/rst/admin/billing', key: 'billing', enabled: true, adminOnly: true },
    ],
  },
  {
    key: 'help',
    items: [
      { to: '/rst/admin/guide', key: 'guide', enabled: true },
    ],
  },
];

/** Flat list for lookups / legacy callers. */
export const RST_ADMIN_NAV = RST_ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export function findRstAdminNav(pathname) {
  const hits = RST_ADMIN_NAV.filter((item) => {
    if (item.end) return pathname === item.to || pathname === `${item.to}/`;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });
  if (!hits.length) return null;
  return hits.reduce((best, item) => (item.to.length > best.to.length ? item : best));
}

export function visibleRstAdminNavGroups(role, hasModule) {
  return RST_ADMIN_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && role !== 'ADMIN') return false;
        if (item.module && typeof hasModule === 'function' && !hasModule(item.module)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
