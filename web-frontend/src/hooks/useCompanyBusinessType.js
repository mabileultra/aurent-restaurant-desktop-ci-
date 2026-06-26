import { useQuery } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useTenantScope } from './useTenantScope';

const EMPTY = { types: [], defaultTypeCode: 'UNIVERSAL' };

/**
 * Разрешённые типы бизнеса компании.
 * defaultTypeCode — тип по умолчанию для новых магазинов.
 */
export function useCompanyBusinessType() {
  const { tenantKey, tenantReady } = useTenantScope();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const query = useQuery({
    queryKey: tenantKey('company-business-types'),
    queryFn: () => companyBusinessTypeApi.get().then((r) => r.data),
    staleTime: 300_000,
    enabled: hasHydrated && Boolean(token) && tenantReady,
    placeholderData: EMPTY,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 1;
    },
  });

  const types = query.data?.types ?? [];
  const defaultTypeCode = query.data?.defaultTypeCode ?? 'UNIVERSAL';

  return {
    types,
    defaultTypeCode,
    businessType: defaultTypeCode,
    isLoading: query.isPending,
    isError: query.isError,
    isForbidden: query.error?.response?.status === 403,
  };
}
