function isDesktopElectron() {
  return typeof window !== 'undefined' && window.desktopCashier?.isDesktop === true;
}

function hasCashierPosAccess(user) {
  const role = user?.role;
  if (role === 'CASHIER' || role === 'ADMIN' || role === 'MANAGER') return true;
  return Array.isArray(user?.allowedModules) && user.allowedModules.includes('cashierPos');
}

/**
 * Разрешён ли офлайн-режим POS для текущего пользователя.
 * Desktop .exe: любой кассир с доступом к POS (модуль cashierOffline не обязателен).
 * Web: только явный модуль cashierOffline или SUPER_ADMIN.
 */
export function userHasCashierOfflineAccess(user) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (isDesktopElectron() && hasCashierPosAccess(user)) return true;
  return Array.isArray(user.allowedModules) && user.allowedModules.includes('cashierOffline');
}
