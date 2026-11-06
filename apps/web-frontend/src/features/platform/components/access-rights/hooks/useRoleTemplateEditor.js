import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Editable role template state for Access V2 RoleTemplateDrawer.
 */
export function useRoleTemplateEditor({ isOpen, businessType, roleCode, fallbackEnabledKeys, onSaved }) {
  const queryClient = useQueryClient();
  const [dirtyModules, setDirtyModules] = useState(() => new Map());
  const [applyToExisting, setApplyToExisting] = useState(false);

  const enabled = Boolean(isOpen && businessType && roleCode);

  const templateQuery = useQuery({
    queryKey: ['platform-module-access-role-template', businessType, roleCode],
    queryFn: () =>
      platformModuleAccessApi.getRoleTemplate(businessType, roleCode).then((r) => r.data),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isOpen) {
      setDirtyModules(new Map());
      setApplyToExisting(false);
    }
  }, [isOpen, businessType, roleCode]);

  const activeModules = useMemo(() => {
    const set = new Set();
    const modules = templateQuery.data?.modules;
    if (modules && typeof modules === 'object') {
      Object.entries(modules).forEach(([key, allowed]) => {
        if (allowed) set.add(key);
      });
      return set;
    }
    (fallbackEnabledKeys || []).forEach((key) => set.add(key));
    return set;
  }, [templateQuery.data, fallbackEnabledKeys]);

  const isDirty = dirtyModules.size > 0;

  const toggleModule = useCallback((moduleId) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      const baseline = activeModules.has(moduleId);
      const current = next.has(moduleId) ? next.get(moduleId) : baseline;
      const flipped = !current;
      if (flipped === baseline) next.delete(moduleId);
      else next.set(moduleId, flipped);
      return next;
    });
  }, [activeModules]);

  const enableAllInGroup = useCallback((modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      (modules || []).forEach((m) => {
        const id = m.id;
        if (activeModules.has(id)) next.delete(id);
        else next.set(id, true);
      });
      return next;
    });
  }, [activeModules]);

  const disableAllInGroup = useCallback((modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      (modules || []).forEach((m) => {
        const id = m.id;
        if (!activeModules.has(id)) next.delete(id);
        else next.set(id, false);
      });
      return next;
    });
  }, [activeModules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const modules = {};
      activeModules.forEach((key) => {
        modules[key] = true;
      });
      dirtyModules.forEach((allowed, key) => {
        modules[key] = allowed;
      });
      // Keep disabled keys explicit for scope completeness when known from template
      const fromServer = templateQuery.data?.modules || {};
      Object.keys(fromServer).forEach((key) => {
        if (!(key in modules)) modules[key] = false;
      });
      const res = await platformModuleAccessApi.updateRoleTemplate(businessType, roleCode, {
        modules,
        applyToExisting,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setDirtyModules(new Map());
      queryClient.invalidateQueries({ queryKey: ['platform-module-access-role-template', businessType, roleCode] });
      queryClient.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      queryClient.invalidateQueries({ queryKey: ['access-v2-users'] });
      const affected = Number(data?.affectedCount || 0);
      toast.success(
        applyToExisting
          ? `Shablon saqlandi (${affected} ta xodimga ta'sir qiladi)`
          : 'Rol shabloni saqlandi'
      );
      onSaved?.();
    },
    onError: () => {
      toast.error('Shablonni saqlab bo‘lmadi');
    },
  });

  return {
    activeModules,
    dirtyModules,
    isDirty,
    applyToExisting,
    setApplyToExisting,
    toggleModule,
    enableAllInGroup,
    disableAllInGroup,
    isLoading: templateQuery.isLoading,
    isSaving: saveMutation.isPending,
    save: () => saveMutation.mutate(),
    source: templateQuery.data?.source || 'DEFAULT',
  };
}
