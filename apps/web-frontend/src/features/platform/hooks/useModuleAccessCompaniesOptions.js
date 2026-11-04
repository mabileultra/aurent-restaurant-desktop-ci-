import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { MODULE_ACCESS_PLATFORM_FILTER } from '../constants';
import { loadCompaniesOptionsPage } from '../utils/loadCompaniesOptionsPage';

const OPTIONS_PAGE_SIZE = 100;

/**
 * Company options for module-access: server search (name / loginCode) so codes like 77004
 * are reachable beyond the first page of the directory.
 */
export function useModuleAccessCompaniesOptions({ businessType, companyId }) {
  const [companySearch, setCompanySearch] = useState('');
  const debouncedSearch = useDebouncedValue(companySearch.trim(), 300);

  const listQuery = useQuery({
    queryKey: ['companies-options', 'module-access', businessType || 'ALL', debouncedSearch || ''],
    queryFn: () => loadCompaniesOptionsPage({
      businessType,
      search: debouncedSearch || undefined,
      size: OPTIONS_PAGE_SIZE,
    }),
    staleTime: 60_000,
  });

  const selectedId = companyId
    && companyId !== MODULE_ACCESS_PLATFORM_FILTER
    ? String(companyId)
    : '';

  const selectedMissing = Boolean(
    selectedId
    && !(listQuery.data || []).some((c) => String(c?.id) === selectedId)
  );

  const selectedQuery = useQuery({
    queryKey: ['companies-options', 'module-access-selected', selectedId],
    queryFn: () => companyApi.getById(selectedId).then((r) => r.data),
    enabled: selectedMissing,
    staleTime: 60_000,
  });

  const companies = useMemo(() => {
    const rows = [...(listQuery.data || [])];
    const selected = selectedQuery.data;
    if (selected?.id != null && !rows.some((c) => String(c.id) === String(selected.id))) {
      rows.push(selected);
    }
    return rows;
  }, [listQuery.data, selectedQuery.data]);

  return {
    companies,
    companySearch,
    setCompanySearch,
    companiesLoading: listQuery.isPending,
  };
}
