import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import { getRoleDefaultModules } from '../utils/roleDefaultModules';
import { buildCatalogGroups } from '../utils/accessRightsCatalogUtils';

export function useAccessRightsTemplatesFlow({
  businessTypes = [],
  rawCatalog = [],
  roles = [],
  selectedBT = 'RESTAURANT',
  onSelectBT,
  onSwitchToStaff,
}) {
  const qc = useQueryClient();
  const [currentRole, setCurrentRole] = useState('ADMIN');
  const [toggles, setToggles] = useState({});
  const [savedToggles, setSavedToggles] = useState({});

  const { data: templateData, isLoading: isTemplateLoading, refetch: refetchTemplate } = useQuery({
    queryKey: ['access-role-template', selectedBT, currentRole],
    queryFn: async () => {
      try {
        const res = await platformModuleAccessApi.getRoleTemplate(selectedBT, currentRole);
        return res?.data?.modules || null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  // Calculate default or backend toggles
  useEffect(() => {
    const defaultIds = getRoleDefaultModules(selectedBT, currentRole);
    const initial = {};
    rawCatalog.forEach((m) => {
      if (templateData && typeof templateData[m.id] === 'boolean') {
        initial[m.id] = templateData[m.id];
      } else {
        initial[m.id] = defaultIds.includes(m.id);
      }
    });
    setToggles(initial);
    setSavedToggles(initial);
  }, [selectedBT, currentRole, templateData, rawCatalog]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    Object.keys(toggles).forEach((k) => {
      if (Boolean(toggles[k]) !== Boolean(savedToggles[k])) count += 1;
    });
    return count;
  }, [toggles, savedToggles]);

  const isDirty = dirtyCount > 0;

  const handleToggleModule = useCallback((moduleId, enabled) => {
    setToggles((prev) => ({ ...prev, [moduleId]: enabled }));
  }, []);

  const moduleGroups = useMemo(() => {
    return buildCatalogGroups(rawCatalog, selectedBT, 'uz');
  }, [rawCatalog, selectedBT]);

  const handleEnableGroup = useCallback((groupId) => {
    const group = moduleGroups.find((g) => g.id === groupId);
    if (!group) return;
    setToggles((prev) => {
      const next = { ...prev };
      group.modules.forEach((m) => { next[m.id] = true; });
      return next;
    });
  }, [moduleGroups]);

  const handleDisableGroup = useCallback((groupId) => {
    const group = moduleGroups.find((g) => g.id === groupId);
    if (!group) return;
    setToggles((prev) => {
      const next = { ...prev };
      group.modules.forEach((m) => { next[m.id] = false; });
      return next;
    });
  }, [moduleGroups]);

  const handleReset = useCallback(() => {
    setToggles(savedToggles);
  }, [savedToggles]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return platformModuleAccessApi.updateRoleTemplate(selectedBT, currentRole, {
        modules: toggles,
      });
    },
    onSuccess: () => {
      setSavedToggles(toggles);
      toast.success('Rol shabloni muvaffaqiyatli saqlandi');
      qc.invalidateQueries({ queryKey: ['access-role-template', selectedBT, currentRole] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Rol shablonini saqlashda xatolik');
    },
  });

  return {
    currentRole,
    setCurrentRole,
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
    handleSave: () => saveMutation.mutate(),
    refetchTemplate,
  };
}
