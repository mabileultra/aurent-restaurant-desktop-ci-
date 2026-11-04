import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import {
  buildCatalogGroups,
  resolveRoleLabel,
} from './accessRightsCatalogUtils';
import { getDefaultModulesForRole, getScopeForRole } from './roleDefaultModules';

/**
 * Rol kartochkalari uchun xulosa ma'lumotlarini (breakdown, istisnolar soni va modullar) hisoblash (SRP)
 */
export function buildRoleSummaries({
  businessType,
  users = [],
  rawCatalog = [],
  roleDefaultsFromBackend = {},
  selectedStats = null,
  isUnfilteredQuery = false,
  t = (k) => k,
}) {
  const allowedRoleCodes = rolesForBusinessType(businessType);

  return allowedRoleCodes.map((roleCode) => {
    const roleUsers = users.filter((u) => String(u.role).toUpperCase() === roleCode.toUpperCase());
    const statsRole = selectedStats?.roleMap?.get(roleCode.toUpperCase());
    const exceptionCount = isUnfilteredQuery && statsRole
      ? Number(statsRole.exceptionCount || 0)
      : roleUsers.filter((u) => Boolean(u.moduleAccessCustom || u.customAccess)).length;
    const totalEmployees = isUnfilteredQuery && statsRole
      ? Number(statsRole.totalEmployees || 0)
      : roleUsers.length;

    const backendRoleData = roleDefaultsFromBackend[roleCode.toUpperCase()];
    const roleScope = backendRoleData?.scopeKeys || getScopeForRole(roleCode, businessType);
    const enabledModuleKeys = backendRoleData?.defaultKeys || getDefaultModulesForRole(roleCode, businessType);

    const roleGroups = buildCatalogGroups(rawCatalog, businessType, t, roleScope);
    const breakdown = roleGroups
      .map((g) => {
        const enabledInGroup = g.modules.filter((m) => enabledModuleKeys.has(m.id)).length;
        return { name: g.title, enabled: enabledInGroup, total: g.modules.length };
      })
      .filter((g) => g.total > 0 && g.enabled > 0);

    return {
      code: roleCode,
      name: resolveRoleLabel(roleCode, t),
      totalEmployees,
      exceptionCount,
      enabledModulesCount: enabledModuleKeys.size,
      totalModulesCount: roleScope.size,
      enabledModuleKeys,
      roleScope,
      breakdown,
      users: roleUsers,
    };
  });
}
