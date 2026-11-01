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

/**
 * Barcha kompaniyalar xaritasi (id -> company) hooki (SRP)
 * Global qidiruvda har bir xodimning faoliyat turini (businessType) aniqlash uchun ishlatiladi
 */
export function useAccessRightsCompaniesMap() {
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['access-v2-all-companies'],
    queryFn: () => loadCompaniesOptionsPage(),
    staleTime: 300_000,
  });

  return allCompanies.reduce((acc, c) => {
    if (c && c.id != null) acc.set(c.id, c);
    return acc;
  }, new Map());
}
