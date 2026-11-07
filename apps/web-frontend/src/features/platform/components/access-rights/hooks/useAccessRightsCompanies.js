import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadCompaniesOptionsPage } from '../../../utils/loadCompaniesOptionsPage';

/**
 * Super Admin kirish huquqlari sahifasida kompaniyalar ro'yxatini yuklash hooki (SRP)
 * Barcha kompaniyalar bitta keshlangan so'rov bilan yuklanadi, takroriy so'rovlar oldi olinadi.
 */
export function useAccessRightsCompanies(businessType) {
  const isAll = !businessType || businessType === 'ALL';
  const {
    data: allCompanies = [],
    isLoading: companiesLoading,
    isError: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ['access-v2-all-companies'],
    queryFn: () => loadCompaniesOptionsPage(),
    staleTime: 300_000,
  });

  const companies = useMemo(() => {
    if (isAll) return allCompanies;
    return allCompanies.filter((c) => String(c.businessType || '').toUpperCase() === String(businessType).toUpperCase());
  }, [allCompanies, isAll, businessType]);

  return {
    companies,
    allCompanies,
    companiesLoading,
    companiesError,
    refetchCompanies,
  };
}

/**
 * Barcha kompaniyalar xaritasi (id -> company) hooki (SRP)
 */
export function useAccessRightsCompaniesMap() {
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['access-v2-all-companies'],
    queryFn: () => loadCompaniesOptionsPage(),
    staleTime: 300_000,
  });

  return useMemo(() => {
    const map = new Map();
    allCompanies.forEach((c) => {
      if (c && c.id != null) map.set(c.id, c);
    });
    return map;
  }, [allCompanies]);
}
