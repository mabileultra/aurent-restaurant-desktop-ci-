import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformModuleAccessApi } from '../../../../../api';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import {
  buildCatalogGroups,
  buildCatalogMap,
  ROLE_LABELS_UZ,
} from '../utils/accessRightsCatalogUtils';
import {
  getDefaultModulesForRole,
  BUSINESS_TYPE_NAMES_UZ,
  PLATFORM_MODULE_KEYS,
} from '../utils/roleDefaultModules';
import { isModuleVisibleForBusinessType } from '../../../utils/moduleAccessByBusinessType';

const SESSION_KEY = 'access_rights_v2_overrides';

function loadSessionOverrides() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    const map = new Map();
    Object.entries(parsed).forEach(([k, arr]) => map.set(k, new Set(arr)));
    return map;
  } catch {
    return new Map();
  }
}

export function useAccessRightsV2Data() {
  const [selectedBT, setSelectedBT] = useState('RESTAURANT');
  const [roleOverrides, setRoleOverrides] = useState(loadSessionOverrides);

  const { data: rawBusinessTypes = [], isLoading: btLoading } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const { data: rawCatalog = [] } = useQuery({
    queryKey: ['platform-module-access-catalog'],
    queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data || []),
    staleTime: 300_000,
  });

  const { data: rawUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['access-v2-users', selectedBT],
    queryFn: () =>
      platformModuleAccessApi.listUsers({ businessType: selectedBT, size: 500 }).then((r) => {
        const content = r.data?.content || r.data || [];
        return Array.isArray(content) ? content : [];
      }),
    staleTime: 60_000,
  });

  const { data: btCounts = {} } = useQuery({
    queryKey: ['access-v2-bt-counts', rawBusinessTypes.map((b) => b.code).join(',')],
    queryFn: async () => {
      const counts = {};
      await Promise.all(
        rawBusinessTypes.map(async (bt) => {
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
    staleTime: 120_000,
  });

  const catalogMap = useMemo(() => buildCatalogMap(rawCatalog), [rawCatalog]);
  const moduleGroups = useMemo(
    () => buildCatalogGroups(rawCatalog, selectedBT),
    [rawCatalog, selectedBT]
  );

  const businessTypes = useMemo(() => {
    if (!rawBusinessTypes.length) {
      return [{ code: 'RESTAURANT', name: 'Restoran', totalEmployees: rawUsers.length }];
    }
    return rawBusinessTypes.map((bt) => ({
      code: bt.code,
      name: BUSINESS_TYPE_NAMES_UZ[bt.code] || bt.nameUz || bt.name || bt.code,
      totalEmployees: bt.code === selectedBT ? rawUsers.length : (btCounts[bt.code] ?? 0),
    }));
  }, [rawBusinessTypes, rawUsers, selectedBT, btCounts]);

  const roles = useMemo(() => {
    const allowedRoleCodes = rolesForBusinessType(selectedBT);
    const visibleTenantModules = rawCatalog.filter(
      (m) => !PLATFORM_MODULE_KEYS.has(m.id) && isModuleVisibleForBusinessType(m.id, selectedBT)
    );
    const totalModulesCount = visibleTenantModules.length;

    return allowedRoleCodes.map((roleCode) => {
      const roleUsers = rawUsers.filter(
        (u) => String(u.role).toUpperCase() === roleCode.toUpperCase()
      );
      const exceptionCount = roleUsers.filter(
        (u) => Boolean(u.moduleAccessCustom || u.customAccess)
      ).length;

      const defaultSet = getDefaultModulesForRole(roleCode, selectedBT);
      const overrideSet = roleOverrides.get(`${selectedBT}:${roleCode}`);
      const enabledModuleKeys = overrideSet instanceof Set ? overrideSet : defaultSet;

      const breakdown = moduleGroups.map((g) => ({
        name: g.title,
        enabled: g.modules.filter((m) => enabledModuleKeys.has(m.id)).length,
        total: g.modules.length,
      })).filter((g) => g.total > 0);

      return {
        code: roleCode,
        name: ROLE_LABELS_UZ[roleCode] || roleCode,
        totalEmployees: roleUsers.length,
        exceptionCount,
        enabledModulesCount: enabledModuleKeys.size,
        totalModulesCount,
        enabledModuleKeys,
        breakdown,
        users: roleUsers,
      };
    });
  }, [selectedBT, rawUsers, rawCatalog, moduleGroups, roleOverrides]);

  const handleResetUser = async (userId) => {
    try {
      await platformModuleAccessApi.resetUser(userId);
      toast.success('Xodim muvaffaqiyatli rol shabloniga qaytarildi');
      refetchUsers();
    } catch {
      toast.error('Xodimni qaytarishda xatolik yuz berdi');
    }
  };

  const handleSaveRoleTemplate = (roleCode, finalActiveSet) => {
    setRoleOverrides((prev) => {
      const next = new Map(prev);
      const key = `${selectedBT}:${roleCode}`;
      next.set(key, finalActiveSet);
      try {
        const serializable = {};
        next.forEach((val, k) => { serializable[k] = Array.from(val); });
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializable));
      } catch { /* ignore storage errors */ }
      return next;
    });
  };

  return {
    selectedBT,
    setSelectedBT,
    businessTypes,
    roles,
    rawUsers,
    moduleGroups,
    catalogMap,
    isLoading: btLoading || usersLoading,
    handleResetUser,
    handleSaveRoleTemplate,
  };
}
