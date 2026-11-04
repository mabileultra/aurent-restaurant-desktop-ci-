import { isPlatformUser, isSuperAdminRole } from './platformRoles';

export function resolveHasModule({ role, allowedModules, custom, moduleDefs = [], moduleId }) {
  if (!moduleId || !role) return false;
  if (isSuperAdminRole(role)) return true;
  if (isPlatformUser(role)) {
    return Array.isArray(allowedModules) && allowedModules.includes(moduleId);
  }
  if (custom) {
    return Array.isArray(allowedModules) && allowedModules.includes(moduleId);
  }
  const def = moduleDefs.find((item) => item.id === moduleId);
  // Grant-only modules have no role default. The edge login still returns the
  // cloud list and marks it as not custom, so honor that list for these keys.
  if (def && def.roles.length === 0) {
    return Array.isArray(allowedModules) && allowedModules.includes(moduleId);
  }
  return def ? def.roles.includes(role) : false;
}
