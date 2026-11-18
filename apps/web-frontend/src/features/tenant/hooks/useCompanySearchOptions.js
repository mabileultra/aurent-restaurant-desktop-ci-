import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { buildCompanySelectOptions } from '../utils/companySelectOptions';

export const DEFAULT_COMPANY_SEARCH_PAGE_SIZE = 50;
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * useCompanySearchOptions
 * Kompaniyalar ro'yxatini boshqarish, server-side (debounced) qidiruv
 * va tanlangan kompaniyani xavfsiz ko'rsatish hooki.
 *
 * @param {Object} params
 * @param {Array} [params.initialCompanies=[]] - Boshlang'ich kompaniyalar ro'yxati
 * @param {string|number} [params.selectedCompanyId=''] - Tanlangan kompaniya IDsi
 * @param {string} [params.businessType=''] - Faoliyat turi filtri
 * @param {boolean} [params.enabled=true] - Qidiruv faolligi
 * @param {string} [params.emptyLabel] - Bo'sh variant yorlig'i (masalan 'Barcha kompaniyalar')
 * @param {boolean} [params.includeLoginCode=true] - Kirish kodini ko'rsatish
 * @param {number} [params.pageSize=50] - Qidiruv sahifa hajmi
 */
export function useCompanySearchOptions({
  initialCompanies = [],
  selectedCompanyId = '',
  businessType = '',
  enabled = true,
  emptyLabel,
  includeLoginCode = true,
  pageSize = DEFAULT_COMPANY_SEARCH_PAGE_SIZE,
  defaultSearchQuery = '',
} = {}) {
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const cleanDebounced = typeof debouncedSearch === 'string' ? debouncedSearch.trim() : '';
  const isSearchActive = enabled && cleanDebounced.length > 0;

  // 1. Server-side search query when user types into select search
  const { data: searchResultsRaw, isFetching: isSearching } = useQuery({
    queryKey: ['companies-search-options', cleanDebounced, businessType || 'ALL'],
    queryFn: async () => {
      const res = await companyApi.getAll({
        page: 0,
        size: pageSize,
        search: cleanDebounced,
        businessType: businessType || undefined,
      });
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.content) ? data.content : [];
    },
    enabled: isSearchActive,
    staleTime: 60_000,
  });

  // 2. Fallback initial load if no companies were provided
  const shouldFetchInitial = enabled && (!initialCompanies || initialCompanies.length === 0);
  const { data: fallbackInitialRaw } = useQuery({
    queryKey: ['companies-select-fallback-initial', businessType || 'ALL'],
    queryFn: async () => {
      const res = await companyApi.getAll({
        page: 0,
        size: pageSize,
        sort: 'name,asc',
        businessType: businessType || undefined,
      });
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.content) ? data.content : [];
    },
    enabled: shouldFetchInitial,
    staleTime: 120_000,
  });

  // 3. Ensure selected company exists in list even if past page limit
  const selectedIdStr = selectedCompanyId ? String(selectedCompanyId) : '';
  const isSelectedAlreadyInInitial = useMemo(() => {
    if (!selectedIdStr) return true;
    const baseList = (initialCompanies && initialCompanies.length > 0)
      ? initialCompanies
      : (fallbackInitialRaw || []);
    return baseList.some((c) => String(c?.id) === selectedIdStr);
  }, [initialCompanies, fallbackInitialRaw, selectedIdStr]);

  const { data: selectedCompanyData } = useQuery({
    queryKey: ['company-by-id', selectedIdStr],
    queryFn: async () => {
      const res = await companyApi.getById(selectedIdStr);
      return res?.data ?? null;
    },
    enabled: enabled && Boolean(selectedIdStr) && !isSelectedAlreadyInInitial,
    staleTime: 300_000,
  });

  // 4. Merge initial/fallback, search results, and selected company without duplicates
  const companies = useMemo(() => {
    const map = new Map();

    const baseList = (initialCompanies && initialCompanies.length > 0)
      ? initialCompanies
      : (fallbackInitialRaw || []);

    baseList.forEach((c) => {
      if (c?.id != null) map.set(String(c.id), c);
    });

    if (selectedCompanyData?.id != null) {
      map.set(String(selectedCompanyData.id), selectedCompanyData);
    }

    if (Array.isArray(searchResultsRaw)) {
      searchResultsRaw.forEach((c) => {
        if (c?.id != null) map.set(String(c.id), c);
      });
    }

    return Array.from(map.values());
  }, [initialCompanies, fallbackInitialRaw, searchResultsRaw, selectedCompanyData]);

  // 5. Build Select options
  const options = useMemo(() => {
    return buildCompanySelectOptions(companies, { emptyLabel, includeLoginCode });
  }, [companies, emptyLabel, includeLoginCode]);

  return {
    options,
    companies,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    isSearching,
  };
}
