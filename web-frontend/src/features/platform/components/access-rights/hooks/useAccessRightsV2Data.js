import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformModuleAccessApi } from '../../../../../api';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import {
  buildCatalogGroups,
  buildCatalogMap,
  resolveRoleLabel,
  resolveBusinessTypeName,
} from '../utils/accessRightsCatalogUtils';
import {
  getDefaultModulesForRole,
  getScopeForRole,
} from '../utils/roleDefaultModules';
import { useRoleDefaultsQuery } from './useRoleDefaultsQuery';

const MAX_USERS_PAGE_SIZE = 250;

export function useAccessRightsV2Data() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ru' ? 'ru' : 'uz';
  const [selectedBT, setSelectedBT] = useState('RESTAURANT');

  const {
    data: rawBusinessTypes = [],
    isLoading: btLoading,
    isError: btError,
    error: btErrorObj,
    refetch: refetchBT,
  } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const {
    data: rawCatalog = [],
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErrorObj,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: ['platform-module-access-catalog'],
    queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const {
    data: usersResponse = { content: [], totalElements: 0 },
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorObj,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['access-v2-users', selectedBT],
    queryFn: async () => {
      const res = await platformModuleAccessApi.listUsers({ businessType: selectedBT, size: MAX_USERS_PAGE_SIZE });
      const raw = res.data;
      const content = Array.isArray(raw) ? raw : (raw?.content || []);
      const totalElements = Number(raw?.totalElements ?? raw?.total ?? content.length);
      return { content, totalElements };
    },
    staleTime: 60_000,
  });

  const rawUsers = usersResponse.content;
  const usersTotalElements = usersResponse.totalElements;

  // Haqiqiy backend roleDefault modullari namunaviy xodimlar orqali olinadi (Haqiqat manbai)
  const roleDefaults = useRoleDefaultsQuery(rawUsers);

  // Faol bo'lmagan biznes turlarining soni (faqat 1 marta keshlangan holda yuklanadi)
  const { data: btCounts = {} } = useQuery({
    queryKey: ['access-v2-bt-counts', rawBusinessTypes.map((b) => b.code).join(',')],
    queryFn: async () => {
      const counts = {};
      const otherTypes = rawBusinessTypes.filter((b) => b.code !== selectedBT);
      await Promise.all(
        otherTypes.map(async (bt) => {
          try {
            const res = await platformModuleAccessApi.listUsers({ businessType: bt.code, size: 1 });
            counts[bt.code] = res.data?.totalElements ?? res.data?.total ?? 0;
          } catch {
            counts[bt.code] = 0;
          }
        })
      );
      return counts;
    },
    enabled: rawBusinessTypes.length > 0,
    staleTime: Infinity,
  });

  const catalogMap = useMemo(() => buildCatalogMap(rawCatalog, t), [rawCatalog, t]);
  const moduleGroups = useMemo(
    () => buildCatalogGroups(rawCatalog, selectedBT, t),
    [rawCatalog, selectedBT, t]
  );

  const businessTypes = useMemo(() => {
    if (!rawBusinessTypes.length) {
      return [{ code: 'RESTAURANT', name: resolveBusinessTypeName('RESTAURANT', t), totalEmployees: usersTotalElements || rawUsers.length }];
    }
    return rawBusinessTypes.map((bt) => ({
      code: bt.code,
      name: resolveBusinessTypeName(bt.code, t) || bt.nameUz || bt.name || bt.code,
      totalEmployees: bt.code === selectedBT ? (usersTotalElements || rawUsers.length) : (btCounts[bt.code] ?? 0),
    }));
  }, [rawBusinessTypes, rawUsers, usersTotalElements, selectedBT, btCounts, t]);

  const roles = useMemo(() => {
    const allowedRoleCodes = rolesForBusinessType(selectedBT);

    return allowedRoleCodes.map((roleCode) => {
      const roleUsers = rawUsers.filter(
        (u) => String(u.role).toUpperCase() === roleCode.toUpperCase()
      );
      const exceptionCount = roleUsers.filter(
        (u) => Boolean(u.moduleAccessCustom || u.customAccess)
      ).length;

      const backendDefault = roleDefaults[roleCode.toUpperCase()];
      const roleScope = backendDefault?.scopeKeys || getScopeForRole(roleCode, selectedBT);
      const enabledModuleKeys = backendDefault?.defaultKeys || getDefaultModulesForRole(roleCode, selectedBT);

      // Guruhlar bo'yicha taqsimot: faqat ushbu rol doirasiga (scope) tegishli modullar
      const breakdown = moduleGroups
        .map((g) => {
          const roleModulesInGroup = g.modules.filter((m) => roleScope.has(m.id));
          const enabledInGroup = roleModulesInGroup.filter((m) => enabledModuleKeys.has(m.id)).length;
          return {
            name: g.title,
            enabled: enabledInGroup,
            total: roleModulesInGroup.length,
          };
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
  }, [selectedBT, rawUsers, roleDefaults, moduleGroups, t]);

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

  const isError = btError || catalogError || usersError;
  const errorObj = btErrorObj || catalogErrorObj || usersErrorObj;

  return {
    selectedBT,
    setSelectedBT,
    businessTypes,
    roles,
    rawUsers,
    moduleGroups,
    catalogMap,
    isLoading: btLoading || catalogLoading || usersLoading,
    isError,
    error: errorObj,
    isTruncated,
    refetchAll,
    handleResetUser,
  };
}
