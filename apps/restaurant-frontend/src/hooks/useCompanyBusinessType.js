import { useQuery } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useTenantScope } from './useTenantScope';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

const EMPTY = { types: [], defaultTypeCode: 'RESTAURANT' };

/** Разрешённые типы бизнеса компании (ресторанный SPA). */
export function useCompanyBusinessType() {
  const { tenantKey, tenantReady } = useTenantScope();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const enabled = hasHydrated && Boolean(token) && tenantReady;

  const query = useQuery({
    queryKey: tenantKey('company-business-types'),
    queryFn: () => companyBusinessTypeApi.get().then((r) => r.data),
    staleTime: 300_000,
    enabled,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 1;
    },
  });

  const types = query.data?.types ?? EMPTY.types;
  const defaultTypeCode = normalizeBusinessTypeCode(
    query.data?.defaultTypeCode ?? EMPTY.defaultTypeCode,
  );

  return {
    types,
    defaultTypeCode,
    businessType: defaultTypeCode,
    isLoading: enabled ? !query.isFetched : !hasHydrated,
    isError: query.isError,
    isForbidden: query.error?.response?.status === 403,
  };
}
