import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import { getScopeForRole } from '../utils/roleDefaultModules';

/**
 * Loads and reacts to module template counts across all business types and roles.
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
      const fetchPromises = [];

      for (const bt of activeBTs) {
        const roles = rolesForBusinessType(bt.code);
        for (const role of roles) {
          fetchPromises.push(
            platformModuleAccessApi
              .getRoleTemplate(bt.code, role)
              .then((res) => {
                const data = res?.data;
                if (!data) return null;
                if (typeof qc?.setQueryData === 'function') {
                  qc.setQueryData(['access-role-template', bt.code, role], data);
                }
                const scope = getScopeForRole(role, bt.code);
                const count = data.modules
                  ? Object.entries(data.modules).filter(([k, v]) => scope.has(k) && Boolean(v)).length
                  : null;
                return { key: `${bt.code}_${role}`, count };
              })
              .catch(() => null)
          );
        }
      }

      const results = await Promise.allSettled(fetchPromises);
      const nextCounts = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value && r.value.count !== null) {
          nextCounts[r.value.key] = r.value.count;
        }
      });

      setTemplateCounts((prev) => ({ ...prev, ...nextCounts }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [businessTypes, qc]);

  useEffect(() => {
    fetchAllTemplates();
  }, [fetchAllTemplates]);

  const getEnabledCount = useCallback(
    (btCode, roleCode, defaultCount = 0) => {
      if (btCode === selectedBT && roleCode === currentRole) {
        return Object.values(currentToggles).filter(Boolean).length;
      }
      const key = `${btCode}_${roleCode}`;
      if (templateCounts[key] !== undefined) {
        return templateCounts[key];
      }
      const cached = typeof qc?.getQueryData === 'function'
        ? qc.getQueryData(['access-role-template', btCode, roleCode])
        : null;
      if (cached?.modules) {
        const scope = getScopeForRole(roleCode, btCode);
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
