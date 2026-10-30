import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformModuleAccessApi } from '../../../api';
import {
  MODULE_ACCESS_GROUP_ORDER,
  MODULE_ACCESS_PLATFORM_FILTER,
  MODULE_ACCESS_USER_FILTER_LABELS,
  MODULE_ACCESS_USER_FILTERS,
} from '../constants';
import {
  buildTogglesFromDetail,
  catalogGroupFor,
} from '../utils/moduleAccessUtils';
import { filterModulesForBusinessType, normalizeBusinessTypeCode } from '../utils/moduleAccessByBusinessType';
import { loadCompaniesOptionsPage } from '../utils/loadCompaniesOptionsPage';
import { isRoleAllowedForBusinessType } from '../utils/rolesByBusinessType';
import { isPlatformAdminRole, isSuperAdminRole } from '../../../utils/platformRoles';
import { useAuthStore } from '../../../store/authStore';
import { useModuleAccessMutations } from './useModuleAccessMutations';
import { useModuleAccessUsersQuery } from './useModuleAccessUsersQuery';

export function usePlatformModuleAccessPage() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const canManagePlatformStaff = isSuperAdminRole(role);
  const [companyId, setCompanyId] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [customAccess, setCustomAccess] = useState(false);
  const [moduleToggles, setModuleToggles] = useState({});

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-options', businessType || 'ALL'],
    queryFn: () => loadCompaniesOptionsPage({ businessType }),
    staleTime: 60_000,
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['platform-module-access-catalog'],
    queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data),
  });

  const catalogById = useMemo(() => {
    const map = {};
    for (const row of catalog) map[row.id] = row.group;
    return map;
  }, [catalog]);

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => {
      if (c?.id != null) map.set(String(c.id), c);
    });
    return map;
  }, [companies]);

  const usersQuery = useModuleAccessUsersQuery({
    companyId,
    businessType,
    userSearch,
    userFilter,
    canManagePlatformStaff,
  });

  const filteredUsers = useMemo(() => {
    if (!businessType) return usersQuery.filteredUsers;
    return usersQuery.filteredUsers.filter((user) => {
      if (isPlatformAdminRole(user.role)) return false;
      return isRoleAllowedForBusinessType(user.role, businessType);
    });
  }, [usersQuery.filteredUsers, businessType]);

  const selectedUser = filteredUsers.find((u) => u.userId === selectedUserId)
    || usersQuery.filteredUsers.find((u) => u.userId === selectedUserId);

  const selectedCompany =
    companyById.get(String(companyId || ''))
    || companyById.get(String(selectedUser?.companyId ?? ''));

  const selectedCompanyBusinessType = isPlatformAdminRole(selectedUser?.role)
    ? ''
    : normalizeBusinessTypeCode(selectedCompany?.businessType);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['platform-module-access-detail', selectedUserId],
    queryFn: () => platformModuleAccessApi.getUser(selectedUserId).then((r) => r.data),
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    if (!detail) return;
    setCustomAccess(detail.moduleAccessCustom);
    setModuleToggles(buildTogglesFromDetail(detail));
  }, [detail]);

  useEffect(() => {
    if (canManagePlatformStaff) return;
    if (companyId === MODULE_ACCESS_PLATFORM_FILTER) setCompanyId('');
    if (selectedUser && isPlatformAdminRole(selectedUser.role)) setSelectedUserId(null);
  }, [canManagePlatformStaff, companyId, selectedUser]);

  const visibleDetailModules = useMemo(
    () => filterModulesForBusinessType(detail?.modules ?? [], selectedCompanyBusinessType),
    [detail, selectedCompanyBusinessType]
  );

  const groupedModules = useMemo(() => {
    const byGroup = {};
    for (const row of visibleDetailModules) {
      const cat = catalogGroupFor(row.id, catalogById);
      if (!byGroup[cat]) byGroup[cat] = [];
      byGroup[cat].push(row);
    }
    return MODULE_ACCESS_GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({
      group: g,
      items: byGroup[g],
    }));
  }, [visibleDetailModules, catalogById]);

  const { saveMutation, bulkSaveMutation, resetMutation, isSaving } = useModuleAccessMutations({
    t,
    selectedUserId,
    setCustomAccess,
    setModuleToggles,
  });

  const buildModulesPayload = () => {
    const modules = {};
    for (const row of detail?.modules ?? []) {
      modules[row.id] = Object.prototype.hasOwnProperty.call(moduleToggles, row.id)
        ? !!moduleToggles[row.id]
        : !!row.allowed;
    }
    for (const row of visibleDetailModules) {
      modules[row.id] = !!moduleToggles[row.id];
    }
    return modules;
  };

  const buildSavePayload = () => {
    const modules = buildModulesPayload();
    if (!Object.values(modules).some(Boolean)) {
      toast.error(t('platform.moduleAccess.needOne'));
      return null;
    }
    return { customAccess: true, modules };
  };

  const handleSave = () => {
    if (!selectedUserId || !detail?.modules?.length) return;
    if (!customAccess) {
      resetMutation.mutate();
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    saveMutation.mutate(payload);
  };

  const handleBulkApply = () => {
    if (!detail?.modules?.length || selectedUserIds.size === 0) {
      toast.error(t('platform.moduleAccess.pickUsersForBulk'));
      return;
    }
    if (!customAccess) {
      toast.error(t('platform.moduleAccess.enableCustomFirst'));
      return;
    }
    const userIds = [...selectedUserIds].filter((userId) => {
      const row = filteredUsers.find((user) => user.userId === userId);
      return row?.role === selectedUser?.role;
    });
    if (userIds.length === 0) {
      toast.error(t('platform.moduleAccess.pickUsersForBulk'));
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    bulkSaveMutation.mutate({ userIds, payload });
  };

  return {
    t,
    companies,
    companyId,
    handleCompanyChange: (value) => {
      setCompanyId(value);
      setSelectedUserId(null);
      setSelectedUserIds(new Set());
    },
    includePlatformStaff: canManagePlatformStaff,
    businessType,
    businessTypes,
    handleBusinessTypeChange: (code) => {
      setBusinessType(code || '');
      setCompanyId('');
      setSelectedUserId(null);
      setSelectedUserIds(new Set());
    },
    selectedCompanyBusinessType,
    usersLoading: usersQuery.usersLoading,
    filteredUsers,
    usersListResetKey: usersQuery.usersListResetKey,
    usersHasMore: usersQuery.hasMore,
    usersLoadMore: usersQuery.loadMore,
    usersTotal: usersQuery.total,
    unconfiguredCount: usersQuery.unconfiguredCount,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    filterOptions: MODULE_ACCESS_USER_FILTERS.map((key) => [key, t(MODULE_ACCESS_USER_FILTER_LABELS[key])]),
    selectedUserId,
    setSelectedUserId,
    selectedUserIds,
    toggleUserSelection: (userId) => {
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    },
    allFilteredSelected:
      filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.userId)),
    handleSelectAllFilteredUsers: (checked) => {
      setSelectedUserIds(checked ? new Set(filteredUsers.map((u) => u.userId)) : new Set());
    },
    selectedUser,
    detail,
    detailLoading,
    customAccess,
    setCustomAccess,
    moduleToggles,
    groupedModules,
    handleToggleModule: (moduleId, checked) => {
      setCustomAccess(true);
      setModuleToggles((prev) => ({ ...prev, [moduleId]: checked }));
    },
    setAllModules: (enabled, groupFilter = null) => {
      if (!visibleDetailModules.length) return;
      setCustomAccess(true);
      setModuleToggles((prev) => {
        const next = { ...prev };
        for (const row of visibleDetailModules) {
          const group = catalogGroupFor(row.id, catalogById);
          if (groupFilter && group !== groupFilter) continue;
          next[row.id] = enabled;
        }
        return next;
      });
    },
    handleBulkApply,
    handleSave,
    resetMutation,
    bulkSaveMutation,
    isSaving,
  };
}
