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
  return def ? def.roles.includes(role) : false;
}
