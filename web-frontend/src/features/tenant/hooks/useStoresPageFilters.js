import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';

export function useStoresPageFilters({
  showCompanySelect = false,
  companyIdFilter,
} = {}) {
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState(
    companyIdFilter != null && companyIdFilter !== '' ? String(companyIdFilter) : ''
  );
  const [businessType, setBusinessType] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [groupedPage, setGroupedPage] = useState(0);
  const [groupedPageSize, setGroupedPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('focusCompany') || sp.has('company') || window.location.hash?.startsWith('#company-')) {
        return 'grouped';
      }
      return localStorage.getItem('stores-view-mode') || (showCompanySelect ? 'grouped' : 'table');
    }
    return showCompanySelect ? 'grouped' : 'table';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stores-view-mode', mode);
    }
  };

  const resolvedCompanyId = showCompanySelect
    ? (companyId ? Number(companyId) : undefined)
    : companyIdFilter;
  const debouncedSearch = useDebouncedValue(search, 300);
  const isGroupedViewActive = Boolean(showCompanySelect && viewMode === 'grouped');

  const resetPages = () => {
    setPage(0);
    setGroupedPage(0);
  };

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch.trim() || undefined,
      companyId: resolvedCompanyId,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
    }),
    [debouncedSearch, page, pageSize, resolvedCompanyId, businessType, regionCode, districtCode]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    companyId,
    setCompanyId,
    resolvedCompanyId,
    businessType,
    setBusinessType,
    regionCode,
    setRegionCode,
    districtCode,
    setDistrictCode,
    page,
    setPage,
    pageSize,
    setPageSize,
    groupedPage,
    setGroupedPage,
    groupedPageSize,
    setGroupedPageSize,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    isGroupedViewActive,
    queryParams,
    resetPages,
    handleSearchChange: (value) => {
      setSearch(value);
      resetPages();
    },
    handleCompanyChange: (value) => {
      setCompanyId(value || '');
      resetPages();
    },
    handleBusinessTypeChange: (code) => {
      setBusinessType(code || '');
      resetPages();
    },
    handleGeoChange: ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
      setRegionCode(nextRegion || '');
      setDistrictCode(nextDistrict || '');
      resetPages();
    },
    handleStatusFilterChange: (next) => {
      setStatusFilter(next);
      resetPages();
    },
  };
}
