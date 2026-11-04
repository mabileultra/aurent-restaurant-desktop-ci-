import { useQuery } from '@tanstack/react-query';
import { businessConfigApi } from '../services/api';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

export function useBusinessConfig(businessTypeCode) {
  const code = normalizeBusinessTypeCode(businessTypeCode);
  return useQuery({
    queryKey: ['business-config', code],
    queryFn: () => businessConfigApi.byCode(code).then((r) => r.data),
    staleTime: 60_000,
  });
}

export default useBusinessConfig;
