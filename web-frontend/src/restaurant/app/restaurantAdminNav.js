export const RST_ADMIN_NAV = [
  { to: '/rst/admin/dashboard', key: 'dashboard', enabled: true },
  { to: '/rst/admin/halls', key: 'halls', enabled: true },
  { to: '/rst/admin/stations', key: 'stations', enabled: true },
  { to: '/rst/admin/menu', key: 'menu', enabled: true },
  { to: '/rst/admin/modifiers', key: 'modifiers', enabled: true },
  { to: '/rst/admin/stock', key: 'stock', enabled: true },
  { to: '/rst/admin/recipes', key: 'recipes', enabled: true },
  { to: '/rst/admin/staff', key: 'staff', enabled: true },
  { to: '/rst/admin/shifts', key: 'shifts', enabled: true },
  { to: '/rst/admin/booking', key: 'booking', enabled: true },
  { to: '/rst/admin/delivery', key: 'delivery', enabled: true },
  { to: '/rst/admin/reports', key: 'reports', enabled: true },
  { to: '/rst/admin/audit', key: 'audit', enabled: true },
];

export function findRstAdminNav(pathname) {
  return RST_ADMIN_NAV.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ?? null;
}
