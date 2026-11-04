import { useQuery } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useTenantScope } from './useTenantScope';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';
import { isPharmacyBusinessType } from '../pharmacy/app/pharmacyPaths';

const EMPTY = { types: [], defaultTypeCode: 'UNIVERSAL' };

/**
 * Разрешённые типы бизнеса компании.
 * defaultTypeCode — тип по умолчанию для новых магазинов.
 */
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
    // Не подставляем UNIVERSAL до ответа API — иначе PharmacyStockReceiptRedirect
    // на миг считает компанию grocery и оставляет /products.
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 1;
    },
  });

  const types = query.data?.types ?? EMPTY.types;
  const defaultTypeCode = query.data?.defaultTypeCode ?? EMPTY.defaultTypeCode;
  const typeCodes = types
    .map((item) => normalizeBusinessTypeCode(item?.code))
    .filter(Boolean);
  const hasPharmacyType = typeCodes.some((code) => isPharmacyBusinessType(code));
  // Аптечный мир: дефолт PHARMACY, либо в компании только аптека.
  const isPharmacyCompany = isPharmacyBusinessType(defaultTypeCode)
    || (hasPharmacyType && typeCodes.length === 1);
  const businessType = isPharmacyCompany ? 'PHARMACY' : defaultTypeCode;

  return {
    types,
    defaultTypeCode,
    businessType,
    hasPharmacyType,
    isPharmacyCompany,
    /** true пока нельзя решать grocery vs pharmacy (ещё нет ответа). */
    isLoading: enabled ? !query.isFetched : !hasHydrated,
    isError: query.isError,
    isForbidden: query.error?.response?.status === 403,
  };
}
