import { MODULE_ACCESS_PLATFORM_FILTER } from '../constants';
import { MODULE_ACCESS_USERS_PAGE_SIZE } from '../components/module-access/users/PlatformModuleAccessUsersList';

/** API scope for module-access users list (excludes UI-only filters). */
export function buildModuleAccessUsersListParams({
  companyId,
  businessType,
  search,
  userFilter,
  size = MODULE_ACCESS_USERS_PAGE_SIZE,
} = {}) {
  const platformOnly = companyId === MODULE_ACCESS_PLATFORM_FILTER;
  const numericCompanyId = platformOnly || !companyId ? undefined : Number(companyId);
  return {
    companyId: Number.isFinite(numericCompanyId) ? numericCompanyId : undefined,
    platformOnly: platformOnly || undefined,
    search: search || undefined,
    accessFilter: userFilter && userFilter !== 'all' ? userFilter : undefined,
    businessType: !platformOnly && !numericCompanyId && businessType ? businessType : undefined,
    size,
  };
}
