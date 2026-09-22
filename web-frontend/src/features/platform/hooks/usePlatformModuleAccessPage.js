import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi, platformBusinessTypeApi, platformModuleAccessApi } from '../../../api';
import { MODULE_ACCESS_GROUP_ORDER, MODULE_ACCESS_PLATFORM_FILTER, MODULE_ACCESS_USER_FILTER_LABELS, MODULE_ACCESS_USER_FILTERS } from '../constants';
import {
  buildTogglesFromDetail,
  catalogGroupFor,
  extractApiError,
} from '../utils/moduleAccessUtils';
import {
  filterModuleAccessUsers,
  withCompanyNames,
} from '../utils/moduleAccessUserFilters';
import {
  companyHasBusinessType,
  filterModulesForBusinessType,
  normalizeBusinessTypeCode,
} from '../utils/moduleAccessByBusinessType';
import { isRoleAllowedForBusinessType } from '../utils/rolesByBusinessType';
import { isPlatformAdminRole, isSuperAdminRole } from '../../../utils/platformRoles';
import { useAuthStore } from '../../../store/authStore';

export function usePlatformModuleAccessPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
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
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
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
    for (const row of catalog) {
      map[row.id] = row.group;
    }
    return map;
  }, [catalog]);

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => {
      if (c?.id != null) map.set(String(c.id), c);
    });
    return map;
  }, [companies]);

  const visibleCompanies = useMemo(() => {
    if (!businessType) return companies;
    return companies.filter((c) => companyHasBusinessType(c, businessType));
  }, [companies, businessType]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['platform-module-access-users'],
    queryFn: () => platformModuleAccessApi.listUsers().then((r) => r.data),
  });

  const namedUsers = useMemo(() => withCompanyNames(users, companies), [users, companies]);

  const scopedUsers = useMemo(() => {
    if (canManagePlatformStaff) return namedUsers;
    return namedUsers.filter((user) => !isPlatformAdminRole(user.role));
  }, [namedUsers, canManagePlatformStaff]);

  const typedUsers = useMemo(() => {
    if (!businessType) return scopedUsers;
    return scopedUsers.filter((user) => {
      if (isPlatformAdminRole(user.role)) return false;
      const company = companyById.get(String(user.companyId ?? ''));
      if (!companyHasBusinessType(company, businessType)) return false;
      return isRoleAllowedForBusinessType(user.role, businessType);
    });
  }, [scopedUsers, businessType, companyById]);

  const companyUsers = useMemo(
    () => filterModuleAccessUsers(typedUsers, { companyId }),
    [typedUsers, companyId]
  );

  const filteredUsers = useMemo(
    () => filterModuleAccessUsers(typedUsers, { companyId, search: userSearch, filter: userFilter }),
    [typedUsers, companyId, userSearch, userFilter]
  );

  const unconfiguredCount = useMemo(
    () => companyUsers.filter((u) => !u.moduleAccessCustom).length,
    [companyUsers]
  );

  const selectedUser = namedUsers.find((u) => u.userId === selectedUserId);

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
    if (companyId === MODULE_ACCESS_PLATFORM_FILTER) {
      setCompanyId('');
    }
    if (selectedUser && isPlatformAdminRole(selectedUser.role)) {
      setSelectedUserId(null);
    }
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

  const saveMutation = useMutation({
    mutationFn: (payload) => platformModuleAccessApi.updateUser(selectedUserId, payload),
    onSuccess: () => {
      setCustomAccess(true);
      toast.success(t('platform.moduleAccess.saved'));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => {
      toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed')));
    },
  });

  const bulkSaveMutation = useMutation({
    mutationFn: async ({ userIds, payload }) => {
      for (const userId of userIds) {
        await platformModuleAccessApi.updateUser(userId, payload);
      }
    },
    onSuccess: (_data, { userIds }) => {
      toast.success(t('platform.moduleAccess.bulkSaved', { count: userIds.length }));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users'] });
      for (const userId of userIds) {
        qc.invalidateQueries({ queryKey: ['platform-module-access-detail', userId] });
      }
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  const resetMutation = useMutation({
    mutationFn: () => platformModuleAccessApi.resetUser(selectedUserId),
    onSuccess: (res) => {
      toast.success(t('platform.moduleAccess.resetDone'));
      setCustomAccess(false);
      setModuleToggles(buildTogglesFromDetail(res.data));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  const buildModulesPayload = () => {
    const modules = {};
    // Preserve hidden (e.g. restaurant) modules from detail; only overwrite visible ones.
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
    const hasAny = Object.values(modules).some(Boolean);
    if (!hasAny) {
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
      const row = namedUsers.find((user) => user.userId === userId);
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

  const handleToggleModule = (moduleId, checked) => {
    setCustomAccess(true);
    setModuleToggles((prev) => ({ ...prev, [moduleId]: checked }));
  };

  const setAllModules = (enabled, groupFilter = null) => {
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
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllFilteredUsers = (checked) => {
    setSelectedUserIds(checked ? new Set(filteredUsers.map((u) => u.userId)) : new Set());
  };

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.userId));

  const handleCompanyChange = (value) => {
    setCompanyId(value);
    setSelectedUserId(null);
    setSelectedUserIds(new Set());
  };

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code || '');
    setCompanyId('');
    setSelectedUserId(null);
    setSelectedUserIds(new Set());
  };

  const isSaving = saveMutation.isPending || resetMutation.isPending || bulkSaveMutation.isPending;

  const filterOptions = useMemo(
    () => MODULE_ACCESS_USER_FILTERS.map((key) => [key, t(MODULE_ACCESS_USER_FILTER_LABELS[key])]),
    [t]
  );

  return {
    t,
    companies: visibleCompanies,
    companyId,
    handleCompanyChange,
    includePlatformStaff: canManagePlatformStaff,
    businessType,
    businessTypes,
    handleBusinessTypeChange,
    selectedCompanyBusinessType,
    usersLoading,
    filteredUsers,
    unconfiguredCount,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    filterOptions,
    selectedUserId,
    setSelectedUserId,
    selectedUserIds,
    toggleUserSelection,
    allFilteredSelected,
    handleSelectAllFilteredUsers,
    selectedUser,
    detail,
    detailLoading,
    customAccess,
    setCustomAccess,
    moduleToggles,
    groupedModules,
    handleToggleModule,
    setAllModules,
    handleBulkApply,
    handleSave,
    resetMutation,
    bulkSaveMutation,
    isSaving,
  };
}
