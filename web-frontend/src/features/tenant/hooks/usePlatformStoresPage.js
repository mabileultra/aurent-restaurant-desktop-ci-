import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api';
import { asEntityList } from '../utils/companySelectOptions';

export function usePlatformStoresPage() {
  const companiesQuery = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
  });

  return {
    companies: asEntityList(companiesQuery.data),
    isLoading: companiesQuery.isLoading,
  };
}
