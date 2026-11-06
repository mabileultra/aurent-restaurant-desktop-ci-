export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';

export function isSuperAdminRole(role) {
  return role === SUPER_ADMIN_ROLE;
}

export function isPlatformAdminRole(role) {
  return role === PLATFORM_ADMIN_ROLE;
}

export function isPlatformUser(role) {
  return isSuperAdminRole(role) || isPlatformAdminRole(role);
}

export function hasGrantedPlatformModule(role, allowedModules, moduleId) {
  if (!moduleId || !role) return false;
  if (isSuperAdminRole(role)) return true;
  if (!isPlatformAdminRole(role)) return false;
  return Array.isArray(allowedModules) && allowedModules.includes(moduleId);
}
