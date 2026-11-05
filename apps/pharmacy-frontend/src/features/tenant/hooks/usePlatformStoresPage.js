import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api';
import { asEntityList } from '../utils/companySelectOptions';

export function usePlatformStoresPage({ enabled = false } = {}) {
  const companiesQuery = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled,
    staleTime: 300_000,
  });

  return {
    companies: asEntityList(companiesQuery.data),
    isLoading: companiesQuery.isLoading,
  };
}
