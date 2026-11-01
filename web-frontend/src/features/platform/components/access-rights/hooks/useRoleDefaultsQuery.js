import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Har bir rol uchun bittadan namunaviy xodimni tanlash (Pure function)
 */
export function resolveSampleUserByRole(rawUsers = []) {
  const map = {};
  for (const u of rawUsers) {
    const roleCode = String(u.roleCode || u.role || '').toUpperCase();
    if (!roleCode) continue;
    // Istisnosi yo'q (moduleAccessCustom === false) xodim afzal ko'riladi
    if (!map[roleCode] || (map[roleCode].moduleAccessCustom && !u.moduleAccessCustom)) {
      map[roleCode] = u;
    }
  }
  return map;
}

/**
 * Har bir rol uchun backenddan namunaviy xodim orqali haqiqiy roleDefault huquqlarini olish (Haqiqat manbai)
 */
export function useRoleDefaultsQuery(rawUsers = []) {
  const sampleUserByRole = useMemo(() => resolveSampleUserByRole(rawUsers), [rawUsers]);

  const sampleUserIds = useMemo(
    () => Object.values(sampleUserByRole).map((u) => u.userId || u.id).filter(Boolean),
    [sampleUserByRole]
  );

  const { data: roleDefaults = {} } = useQuery({
    queryKey: ['access-v2-role-defaults', sampleUserIds.sort().join(',')],
    queryFn: async () => {
      const results = {};
      await Promise.all(
        Object.entries(sampleUserByRole).map(async ([roleCode, user]) => {
          try {
            const uid = user.userId || user.id;
            const res = await platformModuleAccessApi.getUser(uid);
            const detail = res.data;
            if (detail && Array.isArray(detail.modules)) {
              const defaultKeys = new Set(
                detail.modules.filter((m) => Boolean(m.roleDefault)).map((m) => m.id)
              );
              const scopeKeys = new Set(detail.modules.map((m) => m.id));
              results[roleCode] = { defaultKeys, scopeKeys };
            }
          } catch {
            // Tarmoq xatosi bo'lsa fallback ishlatiladi
          }
        })
      );
      return results;
    },
    enabled: sampleUserIds.length > 0,
    staleTime: 300_000,
  });

  return roleDefaults;
}
