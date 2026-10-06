export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';
export const PLATFORM_ANALYTICS_ROLE = 'PLATFORM_ANALYTICS';

export function isSuperAdminRole(role) {
  return role === SUPER_ADMIN_ROLE;
}

export function isPlatformAdminRole(role) {
  return role === PLATFORM_ADMIN_ROLE;
}

export function isPlatformAnalyticsRole(role) {
  return role === PLATFORM_ANALYTICS_ROLE;
}

export function isPlatformUser(role) {
  return isSuperAdminRole(role) || isPlatformAdminRole(role) || isPlatformAnalyticsRole(role);
}

export function hasGrantedPlatformModule(role, allowedModules, moduleId) {
  if (!moduleId || !role) return false;
  if (isSuperAdminRole(role)) return true;
  if (!isPlatformAdminRole(role) && !isPlatformAnalyticsRole(role)) return false;
  return Array.isArray(allowedModules) && allowedModules.includes(moduleId);
}
