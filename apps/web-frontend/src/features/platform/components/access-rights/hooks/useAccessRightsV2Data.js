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
  computeNetworkStats,
} from '../utils/accessRightsCatalogUtils';
import { buildRoleSummaries } from '../utils/accessRightsRoleSummaryUtils';
import {
  mapUsersWithCompanyAndBT,
  buildBusinessTypeList,
} from '../utils/accessRightsV2Helpers';
import { useAccessRightsCompanies, useAccessRightsCompaniesMap } from './useAccessRightsCompanies';
import { useAccessRightsStats } from './useAccessRightsStats';
import { fetchAllAccessUsers } from './fetchAllAccessUsers';

export function useAccessRightsV2Data() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';
  const userRole = useAuthStore((s) => s.user?.role);
  const canManagePlatformStaff = isSuperAdminRole(userRole);

  const [selectedBT, setSelectedBTState] = useState('RESTAURANT');
  const [selectedRole, setSelectedRole] = useState('ALL');
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
    setSelectedRole('ALL');
  }, [isSearching]);

  const { data: rawBusinessTypes = [], isLoading: btLoading, isError: btError, error: btErrorObj, refetch: refetchBT } =
    useQuery({ queryKey: ['platform-business-types-options'], queryFn: () => platformBusinessTypeApi.list().then((r) => r.data || []), staleTime: 300_000 });

  const { data: rawCatalog = [], isLoading: catalogLoading, isError: catalogError, error: catalogErrorObj, refetch: refetchCatalog } =
    useQuery({ queryKey: ['platform-module-access-catalog'], queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data || []), staleTime: 300_000 });

  const { companies, companiesLoading } = useAccessRightsCompanies(isPlatformStaff ? '' : effectiveBT);
  const companiesMap = useAccessRightsCompaniesMap();
  const { statsByCode, refetchStats } = useAccessRightsStats();

  const { data: usersResponse = { content: [], totalElements: 0 }, isLoading: usersLoading, isError: usersError, error: usersErrorObj, refetch: refetchUsers } = useQuery({
    queryKey: ['access-v2-users', effectiveBT, selectedCompanyId, debouncedSearch, accessFilter, selectedRole],
    queryFn: async () => {
      const queryBT = (isPlatformStaff || effectiveBT === 'ALL') ? undefined : effectiveBT;
      return fetchAllAccessUsers({
        businessType: queryBT,
        companyId: isPlatformStaff ? undefined : (selectedCompanyId || undefined),
        platformOnly: isPlatformStaff || undefined,
        search: debouncedSearch || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        accessFilter: accessFilter !== 'all' ? accessFilter : undefined,
      });
    },
    staleTime: 60_000,
  });

  const rawUsers = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.content || []);
  const usersTotalElements = Number(usersResponse?.totalElements ?? usersResponse?.total ?? rawUsers.length);
  const selectedStats = statsByCode.get(String(effectiveBT === 'ALL' ? selectedBT : effectiveBT || '').toUpperCase()) || null;

  const users = useMemo(() => {
    return mapUsersWithCompanyAndBT({
      rawUsers,
      companiesMap,
      effectiveBT,
      selectedBT,
      t,
    });
  }, [rawUsers, companiesMap, effectiveBT, selectedBT, t]);

  useEffect(() => {
    if (selectedBT && isUnfilteredQuery) {
      setVisitedCounts((prev) => ({ ...prev, [selectedBT]: users.length }));
    }
  }, [selectedBT, users.length, isUnfilteredQuery]);

  useEffect(() => {
    const key = 'access-rights-false-exceptions-normalized';
    if (typeof sessionStorage === 'undefined' || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    platformModuleAccessApi
      .normalizeFalseExceptions()
      .then((res) => {
        const affected = Number(res?.data?.affected ?? 0);
        if (affected > 0) {
          refetchStats();
          refetchUsers();
          toast.success(
            currentLang === 'ru'
              ? `Снято ложных исключений: ${affected}`
              : `Soxta istisnolar olib tashlandi: ${affected}`
          );
        }
      })
      .catch(() => {
        sessionStorage.removeItem(key);
      });
  }, [currentLang, refetchStats, refetchUsers]);

  const catalogMap = useMemo(() => buildCatalogMap(rawCatalog, t), [rawCatalog, t]);
  const gridBT = effectiveBT === 'ALL' ? selectedBT : effectiveBT;
  const moduleGroups = useMemo(() => buildCatalogGroups(rawCatalog, gridBT, t), [rawCatalog, gridBT, t]);

  const businessTypes = useMemo(() => {
    return buildBusinessTypeList({
      rawBusinessTypes,
      canManagePlatformStaff,
      visitedCounts,
      effectiveBT,
      usersTotalElements,
      isUnfilteredQuery,
      isSearching,
      statsByCode,
      currentLang,
      t,
    });
  }, [rawBusinessTypes, canManagePlatformStaff, visitedCounts, effectiveBT, usersTotalElements, isUnfilteredQuery, isSearching, statsByCode, currentLang, t]);

  const networkStats = useMemo(() => computeNetworkStats(statsByCode), [statsByCode]);

  const roles = useMemo(() => {
    return buildRoleSummaries({
      businessType: gridBT,
      users,
      rawCatalog,
      roleDefaultsFromBackend: {},
      selectedStats,
      isUnfilteredQuery,
      t,
    });
  }, [gridBT, users, rawCatalog, selectedStats, isUnfilteredQuery, t]);

  const handleResetUser = async (userId) => {
    try {
      await platformModuleAccessApi.resetUser(userId);
      toast.success(currentLang === 'ru' ? 'Пользователь сброшен к шаблону' : 'Xodim rol shabloniga qaytarildi');
      refetchUsers();
      refetchStats();
    } catch {
      toast.error(currentLang === 'ru' ? 'Ошибка при сбросе' : 'Xodimni qaytarishda xatolik yuz berdi');
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
    selectedRole, setSelectedRole, searchTerm, setSearchTerm, accessFilter, setAccessFilter,
    isPlatformStaff, canManagePlatformStaff, companies, companiesLoading, companiesMap,
    businessTypes, roles, users, rawUsers: users, rawCatalog, moduleGroups, catalogMap,
    statsByCode, networkStats,
    isLoading: btLoading || catalogLoading || usersLoading,
    isError: btError || catalogError || usersError,
    error: btErrorObj || catalogErrorObj || usersErrorObj,
    totalCount: usersTotalElements, refetchAll, handleResetUser,
  };
}
