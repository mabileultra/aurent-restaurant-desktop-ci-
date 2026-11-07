import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformModuleAccessApi } from '../../../../../api';
import { getDefaultModulesForRole, getScopeForRole } from '../utils/roleDefaultModules';
import { buildCatalogGroups } from '../utils/accessRightsCatalogUtils';

export function useAccessRightsTemplatesFlow({
  businessTypes = [],
  rawCatalog = [],
  roles = [],
  selectedBT = 'RESTAURANT',
  initialRole = 'ADMIN',
  onSelectBT,
  onSwitchToStaff,
}) {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const [currentRole, setCurrentRoleState] = useState(initialRole);
  const [toggles, setToggles] = useState({});
  const [savedToggles, setSavedToggles] = useState({});

  const roleScope = useMemo(() => {
    return getScopeForRole(currentRole, selectedBT);
  }, [currentRole, selectedBT]);

  const defaultRoleModules = useMemo(() => {
    return getDefaultModulesForRole(currentRole, selectedBT);
  }, [currentRole, selectedBT]);

  // Load template from backend (modules, source: TEMPLATE | DEFAULT, affectedCount)
  const {
    data: templateResponse,
    isLoading: isTemplateLoading,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['access-role-template', selectedBT, currentRole],
    queryFn: async () => {
      try {
        const res = await platformModuleAccessApi.getRoleTemplate(selectedBT, currentRole);
        return res?.data || null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const templateModules = templateResponse?.modules || null;
  const templateSource = templateResponse?.source || 'DEFAULT';

  // Calculate default or backend toggles scoped to this role
  useEffect(() => {
    const initial = {};
    roleScope.forEach((modId) => {
      if (templateModules && typeof templateModules[modId] === 'boolean') {
        initial[modId] = templateModules[modId];
      } else {
        initial[modId] = defaultRoleModules.has(modId);
      }
    });
    setToggles(initial);
    setSavedToggles(initial);
  }, [selectedBT, currentRole, templateModules, roleScope, defaultRoleModules]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    roleScope.forEach((k) => {
      if (Boolean(toggles[k]) !== Boolean(savedToggles[k])) count += 1;
    });
    return count;
  }, [toggles, savedToggles, roleScope]);

  const isDirty = dirtyCount > 0;

  // Unload warning for templates tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleToggleModule = useCallback((moduleId, enabled) => {
    setToggles((prev) => ({ ...prev, [moduleId]: enabled }));
  }, []);

  // Filter catalog groups by current role's allowed scope
  const moduleGroups = useMemo(() => {
    return buildCatalogGroups(rawCatalog, selectedBT, isRu ? 'ru' : 'uz', roleScope);
  }, [rawCatalog, selectedBT, isRu, roleScope]);

  const handleEnableGroup = useCallback((groupId, visibleModuleIds) => {
    setToggles((prev) => {
      const next = { ...prev };
      if (Array.isArray(visibleModuleIds) && visibleModuleIds.length > 0) {
        visibleModuleIds.forEach((id) => { next[id] = true; });
      } else {
        const group = moduleGroups.find((g) => g.id === groupId);
        if (group) group.modules.forEach((m) => { next[m.id] = true; });
      }
      return next;
    });
  }, [moduleGroups]);

  const handleDisableGroup = useCallback((groupId, visibleModuleIds) => {
    setToggles((prev) => {
      const next = { ...prev };
      if (Array.isArray(visibleModuleIds) && visibleModuleIds.length > 0) {
        visibleModuleIds.forEach((id) => { next[id] = false; });
      } else {
        const group = moduleGroups.find((g) => g.id === groupId);
        if (group) group.modules.forEach((m) => { next[m.id] = false; });
      }
      return next;
    });
  }, [moduleGroups]);

  const handleReset = useCallback(() => {
    setToggles(savedToggles);
  }, [savedToggles]);

  // Reset to system default (Standartga qaytarish)
  const handleResetToDefault = useCallback(() => {
    const defaultInitial = {};
    roleScope.forEach((modId) => {
      defaultInitial[modId] = defaultRoleModules.has(modId);
    });
    setToggles(defaultInitial);
    toast.success(
      isRu
        ? 'Шаблон сброшен к системным стандартам. Нажмите "Сохранить", чтобы применить.'
        : 'Shablon tizim standartlariga tiklandi. Qo‘llash uchun "Saqlash"ni bosing.'
    );
  }, [roleScope, defaultRoleModules, isRu]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Send ONLY modules within this role's scope
      const scopedPayload = {};
      roleScope.forEach((k) => {
        scopedPayload[k] = Boolean(toggles[k]);
      });
      return platformModuleAccessApi.updateRoleTemplate(selectedBT, currentRole, {
        modules: scopedPayload,
      });
    },
    onSuccess: () => {
      setSavedToggles(toggles);
      toast.success(isRu ? 'Шаблон роли сохранён' : 'Rol shabloni muvaffaqiyatli saqlandi');
      qc.invalidateQueries({ queryKey: ['access-role-template', selectedBT, currentRole] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
    },
    onError: (err) => {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      let msg = isRu ? 'Ошибка при сохранении шаблона' : 'Rol shablonini saqlashda xatolik';
      if (rawMsg.includes('not in role scope')) {
        msg = isRu ? 'Модуль не входит в область прав данной роли' : 'Modul ushbu rol doirasiga kirmaydi';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      toast.error(msg);
    },
    meta: { suppressGlobalError: true },
  });

  return {
    currentRole,
    setCurrentRole: setCurrentRoleState,
    templateSource,
    toggles,
    savedToggles,
    isDirty,
    dirtyCount,
    isSaving: saveMutation.isPending,
    isTemplateLoading,
    moduleGroups,
    handleToggleModule,
    handleEnableGroup,
    handleDisableGroup,
    handleReset,
    handleResetToDefault,
    handleSave: () => saveMutation.mutate(),
    refetchTemplate,
  };
}
