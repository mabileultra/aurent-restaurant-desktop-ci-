import { useQuery } from '@tanstack/react-query';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Sozlanmagan (unconfigured) xodimlar sonini yuklash hooki (SRP)
 */
export function useAccessRightsUnconfiguredCount({
  selectedBT,
  selectedCompanyId,
  isPlatformStaff,
}) {
  const { data: unconfiguredCount = 0 } = useQuery({
    queryKey: ['access-v2-unconfigured-count', selectedBT, selectedCompanyId, isPlatformStaff],
    queryFn: async () => {
      try {
        const res = await platformModuleAccessApi.listUsers({
          businessType: isPlatformStaff || selectedBT === 'ALL' ? undefined : selectedBT,
          companyId: selectedCompanyId || undefined,
          platformOnly: isPlatformStaff || undefined,
          accessFilter: 'unconfigured',
          size: 1,
        });
        const d = res.data;
        return Number(d?.totalElements ?? d?.total ?? (Array.isArray(d) ? d.length : 0));
      } catch {
        return 0;
      }
    },
    staleTime: 60_000,
  });

  return unconfiguredCount;
}
