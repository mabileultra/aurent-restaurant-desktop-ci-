import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { ADMIN_MODULE_IDS, CASHIER_MODULE_IDS } from '../config/moduleHandbook';
import { resolveHasModule } from '../utils/moduleAccessGate';

/**
 * Доступ к модулю админки.
 * При moduleAccessCustom — только список allowedModules с бэкенда (без fallback по роли).
 * Без custom — дефолты роли из moduleHandbook.
 */
export function useModuleAccess() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const allowed = user?.allowedModules;
  const custom = user?.moduleAccessCustom;

  const moduleDefs = useMemo(() => [...ADMIN_MODULE_IDS, ...CASHIER_MODULE_IDS], []);

  const hasModule = useCallback(
    (moduleId) => resolveHasModule({
      role,
      allowedModules: allowed,
      custom,
      moduleDefs,
      moduleId,
    }),
    [role, allowed, custom, moduleDefs]
  );

  const hasAnyModule = useCallback(
    (moduleIds) => moduleIds.some((id) => hasModule(id)),
    [hasModule]
  );

  return { hasModule, hasAnyModule, allowedModules: allowed, moduleAccessCustom: custom };
}
