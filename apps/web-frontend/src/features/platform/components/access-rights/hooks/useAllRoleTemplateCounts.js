import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';
import { getScopeForRole } from '../utils/roleDefaultModules';

/**
 * Loads module template counts for all business types/roles in one backend request.
 */
export function useAllRoleTemplateCounts({
  businessTypes = [],
  selectedBT,
  currentRole,
  currentToggles = {},
}) {
  const qc = useQueryClient();
  const [templateCounts, setTemplateCounts] = useState({});
  const isFetchingRef = useRef(false);

  const fetchAllTemplates = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const activeBTs = businessTypes.filter((b) => b.code !== 'ALL');
      if (activeBTs.length === 0) {
        setTemplateCounts({});
        return;
      }

      const res = await platformModuleAccessApi.listRoleTemplates();
      const rows = Array.isArray(res?.data) ? res.data : [];
      const nextCounts = {};

      rows.forEach((data) => {
        if (!data?.businessType || !data?.role) return;
        if (typeof qc?.setQueryData === 'function') {
          qc.setQueryData(['access-role-template', data.businessType, data.role], data);
        }
        const scope = getScopeForRole(data.role, data.businessType);
        const count = data.modules
          ? Object.entries(data.modules).filter(([k, v]) => scope.has(k) && Boolean(v)).length
          : null;
        if (count !== null) {
          nextCounts[`${data.businessType}_${data.role}`] = count;
        }
      });

      setTemplateCounts((prev) => ({ ...prev, ...nextCounts }));
    } catch {
      // Keep previous counts on failure; individual editors still use getRoleTemplate.
    } finally {
      isFetchingRef.current = false;
    }
  }, [businessTypes, qc]);

  useEffect(() => {
    fetchAllTemplates();
  }, [fetchAllTemplates]);

  const getEnabledCount = useCallback(
    (btCode, roleCode, defaultCount = 0) => {
      const scope = getScopeForRole(roleCode, btCode);
      if (btCode === selectedBT && roleCode === currentRole) {
        return Object.entries(currentToggles).filter(([k, v]) => scope.has(k) && Boolean(v)).length;
      }
      const key = `${btCode}_${roleCode}`;
      if (templateCounts[key] !== undefined) {
        return templateCounts[key];
      }
      const cached = typeof qc?.getQueryData === 'function'
        ? qc.getQueryData(['access-role-template', btCode, roleCode])
        : null;
      if (cached?.modules) {
        return Object.entries(cached.modules).filter(([k, v]) => scope.has(k) && Boolean(v)).length;
      }
      return defaultCount;
    },
    [selectedBT, currentRole, currentToggles, templateCounts, qc]
  );

  return {
    templateCounts,
    getEnabledCount,
    refetchCounts: fetchAllTemplates,
  };
}
