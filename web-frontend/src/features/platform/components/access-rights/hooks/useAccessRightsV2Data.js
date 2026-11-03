import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformModuleAccessApi } from '../../../../../api';
import { useAuthStore } from '../../../../../store/authStore';
import { isSuperAdminRole } from '../../../../../utils/platformRoles';
import { useDebouncedValue } from '../../../../../hooks/useDebouncedValue';
import {
  buildCatalogGroups,
  buildCatalogMap,
  resolveBusinessTypeName,
} from '../utils/accessRightsCatalogUtils';
import { buildRoleSummaries } from '../utils/accessRightsRoleSummaryUtils';
import { useRoleDefaultsQuery } from './useRoleDefaultsQuery';
import { useAccessRightsCompanies, useAccessRightsCompaniesMap } from './useAccessRightsCompanies';
import { useAccessRightsUnconfiguredCount } from './useAccessRightsUnconfiguredCount';
import { useAccessRightsStats } from './useAccessRightsStats';

const MAX_USERS_PAGE_SIZE = 250;

export function useAccessRightsV2Data() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';
  const userRole = useAuthStore((s) => s.user?.role);
  const canManagePlatformStaff = isSuperAdminRole(userRole);

  const [selectedBT, setSelectedBTState] = useState('RESTAURANT');
  const [searchBT, setSearchBT] = useState('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [visitedCounts, setVisitedCounts] = useState({});

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);
  const isSearching = Boolean(debouncedSearch);
  const effectiveBT = isSearching ? searchBT : selectedBT;
  const isPlatformStaff = effectiveBT === 'PLATFORM_STAFF';
  const isUnfilteredQuery = !selectedCompanyId && !debouncedSearch && accessFilter === 'all';

  const setSelectedBT = useCallback((bt) => {
    if (isSearching) {
      setSearchBT(bt);
      if (bt !== 'ALL') setSelectedBTState(bt);
    } else {
      setSelectedBTState(bt);
    }
    setSelectedCompanyId('');
  }, [isSearching]);

  const { data: rawBusinessTypes = [], isLoading: btLoading, isError: btError, error: btErrorObj, refetch: refetchBT } =
    useQuery({ queryKey: ['platform-business-types-options'], queryFn: () => platformBusinessTypeApi.list().then((r) => r.data || []), staleTime: 300_000 });

  const { data: rawCatalog = [], isLoading: catalogLoading, isError: catalogError, error: catalogErrorObj, refetch: refetchCatalog } =
    useQuery({ queryKey: ['platform-module-access-catalog'], queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data || []), staleTime: 300_000 });

  const { companies, companiesLoading } = useAccessRightsCompanies(isPlatformStaff ? '' : effectiveBT);
  const companiesMap = useAccessRightsCompaniesMap();
  const unconfiguredCount = useAccessRightsUnconfiguredCount({ selectedBT: effectiveBT, selectedCompanyId, isPlatformStaff });
  const { statsByCode, refetchStats } = useAccessRightsStats();

  const { data: usersResponse = { content: [], totalElements: 0 }, isLoading: usersLoading, isError: usersError, error: usersErrorObj, refetch: refetchUsers } = useQuery({
    queryKey: ['access-v2-users', effectiveBT, selectedCompanyId, debouncedSearch, accessFilter],
    queryFn: async () => {
      const queryBT = (isPlatformStaff || effectiveBT === 'ALL') ? undefined : effectiveBT;
      const res = await platformModuleAccessApi.listUsers({
        businessType: queryBT,
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

  const rawUsers = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.content || []);
  const usersTotalElements = Number(usersResponse?.totalElements ?? usersResponse?.total ?? rawUsers.length);
  const selectedStats = statsByCode.get(String(effectiveBT === 'ALL' ? selectedBT : effectiveBT || '').toUpperCase()) || null;

  const users = useMemo(() => {
    return rawUsers.map((u) => {
      const company = u.companyId ? companiesMap.get(u.companyId) : null;
      const btCode = u.businessType || company?.businessType || (u.companyId ? null : 'PLATFORM_STAFF') || (selectedBT === 'ALL' ? 'RESTAURANT' : selectedBT);
      return {
        ...u,
        businessType: btCode,
        businessTypeName: resolveBusinessTypeName(btCode, t),
        companyName: u.companyName || company?.name || '',
      };
    });
  }, [rawUsers, companiesMap, selectedBT, t]);

  const roleDefaultsFromBackend = useRoleDefaultsQuery(rawUsers);

  useEffect(() => {
    if (selectedBT && typeof usersTotalElements === 'number' && isUnfilteredQuery) {
      setVisitedCounts((prev) => ({ ...prev, [selectedBT]: usersTotalElements }));
    }
  }, [selectedBT, usersTotalElements, isUnfilteredQuery]);

  const catalogMap = useMemo(() => buildCatalogMap(rawCatalog, t), [rawCatalog, t]);
  const gridBT = effectiveBT === 'ALL' ? selectedBT : effectiveBT;
  const moduleGroups = useMemo(() => buildCatalogGroups(rawCatalog, gridBT, t), [rawCatalog, gridBT, t]);

  const businessTypes = useMemo(() => {
    const list = rawBusinessTypes.map((bt) => {
      const fromStats = statsByCode.get(String(bt.code || '').toUpperCase());
      const isSelected = bt.code === effectiveBT;
      const count = fromStats?.totalEmployees
        ?? (isSelected && isUnfilteredQuery ? usersTotalElements : (visitedCounts[bt.code] ?? null));
      return {
        code: bt.code,
        name: resolveBusinessTypeName(bt.code, t) || bt.nameUz || bt.name || bt.code,
        totalEmployees: count,
      };
    });
    if (canManagePlatformStaff) {
      const fromStats = statsByCode.get('PLATFORM_STAFF');
      const isSelected = effectiveBT === 'PLATFORM_STAFF';
      const count = fromStats?.totalEmployees
        ?? (isSelected && isUnfilteredQuery ? usersTotalElements : (visitedCounts['PLATFORM_STAFF'] ?? null));
      list.push({
        code: 'PLATFORM_STAFF',
        name: resolveBusinessTypeName('PLATFORM_STAFF', t),
        totalEmployees: count,
      });
    }
    if (isSearching) {
      list.unshift({
        code: 'ALL',
        name: currentLang === 'ru' ? 'Все направления' : 'Barcha turlar',
        totalEmployees: usersTotalElements,
      });
    }
    return list;
  }, [rawBusinessTypes, canManagePlatformStaff, visitedCounts, effectiveBT, usersTotalElements, isUnfilteredQuery, isSearching, statsByCode, currentLang, t]);

  const roles = useMemo(() => {
    return buildRoleSummaries({
      businessType: gridBT,
      users,
      rawCatalog,
      roleDefaultsFromBackend,
      selectedStats,
      isUnfilteredQuery,
      t,
    });
  }, [gridBT, users, rawCatalog, roleDefaultsFromBackend, selectedStats, isUnfilteredQuery, t]);

  const isTruncated = rawUsers.length >= MAX_USERS_PAGE_SIZE && usersTotalElements > rawUsers.length;

  const handleResetUser = async (userId) => {
    try {
      await platformModuleAccessApi.resetUser(userId);
      toast.success(currentLang === 'ru' ? 'Пользователь успешно сброшен к шаблону' : 'Xodim muvaffaqiyatli rol shabloniga qaytarildi');
      refetchUsers();
      refetchStats();
    } catch {
      toast.error(currentLang === 'ru' ? 'Ошибка при сбросе пользователя' : 'Xodimni qaytarishda xatolik yuz berdi');
    }
  };

  const refetchAll = useCallback(() => {
    refetchBT();
    refetchCatalog();
    refetchUsers();
    refetchStats();
  }, [refetchBT, refetchCatalog, refetchUsers, refetchStats]);

  return {
    selectedBT: effectiveBT, setSelectedBT, selectedCompanyId, setSelectedCompanyId,
    searchTerm, setSearchTerm, accessFilter, setAccessFilter,
    unconfiguredCount, isPlatformStaff, canManagePlatformStaff,
    companies, companiesLoading, companiesMap, businessTypes, roles,
    users, rawUsers: users, rawCatalog, moduleGroups, catalogMap,
    isLoading: btLoading || catalogLoading || usersLoading,
    isError: btError || catalogError || usersError,
    error: btErrorObj || catalogErrorObj || usersErrorObj,
    isTruncated, totalCount: usersTotalElements,
    refetchAll, handleResetUser,
  };
}
