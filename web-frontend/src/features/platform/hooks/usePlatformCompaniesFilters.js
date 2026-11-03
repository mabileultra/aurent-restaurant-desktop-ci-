import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export const PLATFORM_COMPANY_PAGE_SIZE = 14;

export function usePlatformCompaniesFilters() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('loginCode') || '';
  const [search, setSearch] = useState(initialSearch);
  const [businessType, setBusinessType] = useState(() => searchParams.get('businessType') || '');
  const [regionCode, setRegionCode] = useState(() => searchParams.get('regionCode') || '');
  const [districtCode, setDistrictCode] = useState(() => searchParams.get('districtCode') || '');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PLATFORM_COMPANY_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const querySearch = searchParams.get('search') || searchParams.get('loginCode');
    if (querySearch && querySearch !== search) {
      setSearch(querySearch);
    }
  }, [searchParams]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const isFiltered = Boolean(debouncedSearch.trim() || businessType || regionCode || districtCode);

  const handleStatusFilterChange = (next) => {
    setStatusFilter(next);
    setPage(0);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code || '');
    setPage(0);
  };

  const handleGeoChange = ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
    setRegionCode(nextRegion || '');
    setDistrictCode(nextDistrict || '');
    setPage(0);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch.trim() || undefined,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
      active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      sort: 'name,asc',
    }),
    [page, pageSize, debouncedSearch, businessType, regionCode, districtCode, statusFilter]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    businessType,
    setBusinessType,
    regionCode,
    setRegionCode,
    districtCode,
    setDistrictCode,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    isFiltered,
    params,
    handleSearchChange,
    handleBusinessTypeChange,
    handleGeoChange,
  };
}
