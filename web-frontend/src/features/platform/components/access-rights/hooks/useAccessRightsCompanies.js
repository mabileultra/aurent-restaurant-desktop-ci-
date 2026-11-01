import { useQuery } from '@tanstack/react-query';
import { loadCompaniesOptionsPage } from '../../../utils/loadCompaniesOptionsPage';

/**
 * Super Admin kirish huquqlari sahifasida kompaniyalar ro'yxatini yuklash hooki (SRP)
 */
export function useAccessRightsCompanies(businessType) {
  const {
    data: companies = [],
    isLoading: companiesLoading,
    isError: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ['access-v2-companies', businessType],
    queryFn: () => loadCompaniesOptionsPage({ businessType }),
    staleTime: 120_000,
  });

  return {
    companies,
    companiesLoading,
    companiesError,
    refetchCompanies,
  };
}
