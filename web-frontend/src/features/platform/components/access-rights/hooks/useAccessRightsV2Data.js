import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformModuleAccessApi } from '../../../../../api';
import { useAuthStore } from '../../../../../store/authStore';
import { isSuperAdminRole } from '../../../../../utils/platformRoles';
import { useDebouncedValue } from '../../../../../hooks/useDebouncedValue';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import {
  buildCatalogGroups,
  buildCatalogMap,
  resolveRoleLabel,
  resolveBusinessTypeName,
} from '../utils/accessRightsCatalogUtils';
import { getDefaultModulesForRole, getScopeForRole } from '../utils/roleDefaultModules';
import { useBusinessTypeCountsQuery } from './useBusinessTypeCountsQuery';
import { useAccessRightsCompanies } from './useAccessRightsCompanies';
import { useAccessRightsUnconfiguredCount } from './useAccessRightsUnconfiguredCount';

const MAX_USERS_PAGE_SIZE = 250;

export function useAccessRightsV2Data() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';
  const userRole = useAuthStore((s) => s.user?.role);
  const canManagePlatformStaff = isSuperAdminRole(userRole);

  const [selectedBT, setSelectedBTState] = useState('RESTAURANT');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);
  const isPlatformStaff = selectedBT === 'PLATFORM_STAFF';

  const setSelectedBT = useCallback((bt) => {
    setSelectedBTState(bt);
    setSelectedCompanyId('');
  }, []);

  const { data: rawBusinessTypes = [], isLoading: btLoading, isError: btError, error: btErrorObj, refetch: refetchBT } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const { data: rawCatalog = [], isLoading: catalogLoading, isError: catalogError, error: catalogErrorObj, refetch: refetchCatalog } = useQuery({
    queryKey: ['platform-module-access-catalog'],
    queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const { companies, companiesLoading } = useAccessRightsCompanies(isPlatformStaff ? '' : selectedBT);
  const btCounts = useBusinessTypeCountsQuery(rawBusinessTypes, canManagePlatformStaff);
  const unconfiguredCount = useAccessRightsUnconfiguredCount({ selectedBT, selectedCompanyId, isPlatformStaff });

  const { data: usersResponse = { content: [], totalElements: 0 }, isLoading: usersLoading, isError: usersError, error: usersErrorObj, refetch: refetchUsers } = useQuery({
    queryKey: ['access-v2-users', selectedBT, selectedCompanyId, debouncedSearch, accessFilter],
    queryFn: async () => {
      const res = await platformModuleAccessApi.listUsers({
        businessType: isPlatformStaff ? undefined : selectedBT,
        companyId: isPlatformStaff ? undefined : (selectedCompanyId || undefined),
        platformOnly: isPlatformStaff || undefined,
        search: debouncedSearch || undefined,
        accessFilter: accessFilter !== 'all' ? accessFilter : undefined,
        size: MAX_USERS_PAGE_SIZE,
      });
      const raw = res.data;
      const content = Array.isArray(raw) ? raw : (raw?.content || []);
      const totalElements = Number(raw?.totalElements ?? raw?.total ?? content.length);
      return { content, totalElements };
    },
    staleTime: 60_000,
  });

  const rawUsers = usersResponse.content;
  const usersTotalElements = usersResponse.totalElements;

  const catalogMap = useMemo(() => buildCatalogMap(rawCatalog, t), [rawCatalog, t]);
  const moduleGroups = useMemo(() => buildCatalogGroups(rawCatalog, selectedBT, t), [rawCatalog, selectedBT, t]);

  const businessTypes = useMemo(() => {
    const list = rawBusinessTypes.map((bt) => ({
      code: bt.code,
      name: resolveBusinessTypeName(bt.code, t) || bt.nameUz || bt.name || bt.code,
      totalEmployees: btCounts[bt.code] ?? (bt.code === selectedBT ? (usersTotalElements || rawUsers.length) : 0),
    }));
    if (canManagePlatformStaff) {
      list.push({
        code: 'PLATFORM_STAFF',
        name: resolveBusinessTypeName('PLATFORM_STAFF', t),
        totalEmployees: btCounts['PLATFORM_STAFF'] ?? 0,
      });
    }
    return list;
  }, [rawBusinessTypes, canManagePlatformStaff, btCounts, selectedBT, usersTotalElements, rawUsers.length, t]);

  const roles = useMemo(() => {
    const allowedRoleCodes = rolesForBusinessType(selectedBT);

    return allowedRoleCodes.map((roleCode) => {
      const roleUsers = rawUsers.filter((u) => String(u.role).toUpperCase() === roleCode.toUpperCase());
      const exceptionCount = roleUsers.filter((u) => Boolean(u.moduleAccessCustom || u.customAccess)).length;
      const roleScope = getScopeForRole(roleCode, selectedBT);
      const enabledModuleKeys = getDefaultModulesForRole(roleCode, selectedBT);

      const breakdown = moduleGroups
        .map((g) => {
          const roleModulesInGroup = g.modules.filter((m) => roleScope.has(m.id));
          const enabledInGroup = roleModulesInGroup.filter((m) => enabledModuleKeys.has(m.id)).length;
          return { name: g.title, enabled: enabledInGroup, total: roleModulesInGroup.length };
        })
        .filter((g) => g.total > 0 && g.enabled > 0);

      return {
        code: roleCode,
        name: resolveRoleLabel(roleCode, t),
        totalEmployees: roleUsers.length,
        exceptionCount,
        enabledModulesCount: enabledModuleKeys.size,
        totalModulesCount: roleScope.size,
        enabledModuleKeys,
        roleScope,
        breakdown,
        users: roleUsers,
      };
    });
  }, [selectedBT, rawUsers, moduleGroups, t]);

  const isTruncated = rawUsers.length >= MAX_USERS_PAGE_SIZE && usersTotalElements > rawUsers.length;

  const handleResetUser = async (userId) => {
    try {
      await platformModuleAccessApi.resetUser(userId);
      toast.success(currentLang === 'ru' ? 'Пользователь успешно сброшен к шаблону' : 'Xodim muvaffaqiyatli rol shabloniga qaytarildi');
      refetchUsers();
    } catch {
      toast.error(currentLang === 'ru' ? 'Ошибка при сбросе пользователя' : 'Xodimni qaytarishda xatolik yuz berdi');
    }
  };

  const refetchAll = useCallback(() => {
    refetchBT();
    refetchCatalog();
    refetchUsers();
  }, [refetchBT, refetchCatalog, refetchUsers]);

  return {
    selectedBT,
    setSelectedBT,
    selectedCompanyId,
    setSelectedCompanyId,
    searchTerm,
    setSearchTerm,
    accessFilter,
    setAccessFilter,
    unconfiguredCount,
    isPlatformStaff,
    canManagePlatformStaff,
    companies,
    companiesLoading,
    businessTypes,
    roles,
    rawUsers,
    rawCatalog,
    moduleGroups,
    catalogMap,
    isLoading: btLoading || catalogLoading || usersLoading,
    isError: btError || catalogError || usersError,
    error: btErrorObj || catalogErrorObj || usersErrorObj,
    isTruncated,
    totalCount: usersTotalElements,
    refetchAll,
    handleResetUser,
  };
}
