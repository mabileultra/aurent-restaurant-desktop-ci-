/** Домашний маршрут после входа / при отказе в доступе. */
export function resolveRoleHomePath(role) {
  if (role === 'SUPER_ADMIN') return '/platform';
  if (role === 'CASHIER') return '/cashier';
  if (role === 'WAITER') return '/cashier/restaurant';
  if (role === 'ACCOUNTANT') return '/finance/dashboard';
  return '/dashboard';
}
