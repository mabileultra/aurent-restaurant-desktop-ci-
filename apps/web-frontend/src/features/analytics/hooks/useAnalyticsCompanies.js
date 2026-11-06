import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { analyticsApi } from '../api/analyticsApi';
import { fetchAllCompanies } from '../utils/analyticsCompanyLoader';
import { calculateFiscalDistribution, calculateTop5Share } from '../utils/analyticsCalculations';
import { useAnalyticsPeriodStore } from './useAnalyticsPeriodStore';

export function useAnalyticsCompanies() {
  const period = useAnalyticsPeriodStore((s) => s.period);
  const customFrom = useAnalyticsPeriodStore((s) => s.customFrom);
  const customTo = useAnalyticsPeriodStore((s) => s.customTo);
  const setPeriod = useAnalyticsPeriodStore((s) => s.setPeriod);
  const setCustomRange = useAnalyticsPeriodStore((s) => s.setCustomRange);

  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [showExtraFilters, setShowExtraFilters] = useState(false);

  const filterParams = useMemo(() => {
    const range = period === 'custom' && customFrom && customTo
      ? { period: 'custom', from: customFrom, to: customTo }
      : { period: period === 'custom' ? '30d' : period };

    return {
      ...range,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
      connectionStatus: connectionStatus || undefined,
      search: debouncedSearch.trim() || undefined,
    };
  }, [period, customFrom, customTo, regionCode, districtCode, connectionStatus, debouncedSearch]);

  // Fetch all companies across pages so global sorting by totalTurnover is 100% accurate
  const allCompaniesQuery = useQuery({
    queryKey: ['analytics-companies-all', filterParams],
    queryFn: () => fetchAllCompanies(filterParams),
    placeholderData: (prev) => prev,
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => analyticsApi.getRegions().then((res) => res.data),
    staleTime: 600_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', regionCode],
    queryFn: () => analyticsApi.getDistricts(regionCode).then((res) => res.data),
    enabled: Boolean(regionCode),
    staleTime: 600_000,
  });

  // Global sort across all records
  const sortedAllRows = useMemo(() => {
    const list = allCompaniesQuery.data?.rows ?? [];
    return [...list].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  }, [allCompaniesQuery.data?.rows]);

  const totalElements = allCompaniesQuery.data?.totalElements ?? sortedAllRows.length;

  // Paginate from universally sorted dataset
  const rows = useMemo(() => {
    const start = page * size;
    return sortedAllRows.slice(start, start + size);
  }, [sortedAllRows, page, size]);

  const summaryRows = sortedAllRows;

  const totalTurnoverSum = useMemo(() => {
    return summaryRows.reduce((sum, c) => sum + Number(c.totalTurnover || 0), 0);
  }, [summaryRows]);

  const top5 = useMemo(() => calculateTop5Share(summaryRows, totalTurnoverSum), [summaryRows, totalTurnoverSum]);
  const distribution = useMemo(() => calculateFiscalDistribution(summaryRows), [summaryRows]);

  const nonFiscalAmount = useMemo(() => {
    return summaryRows.reduce((sum, c) => sum + Number(c.nonFiscalTurnover || 0), 0);
  }, [summaryRows]);

  const notConnectedSelling = useMemo(() => {
    return summaryRows.filter((c) => !c.connected && Number(c.totalTurnover || 0) > 0);
  }, [summaryRows]);

  const notConnectedAmount = useMemo(() => {
    return notConnectedSelling.reduce((sum, c) => sum + Number(c.nonFiscalTurnover || c.totalTurnover || 0), 0);
  }, [notConnectedSelling]);

  const handleReset = () => {
    setSearch('');
    setRegionCode('');
    setDistrictCode('');
    setConnectionStatus('');
    setPage(0);
  };

  return {
    period,
    setPeriod,
    customFrom,
    customTo,
    handleCustomDateChange: setCustomRange,
    search,
    setSearch: (s) => { setSearch(s); setPage(0); },
    regionCode,
    setRegionCode: (r) => { setRegionCode(r); setDistrictCode(''); setPage(0); },
    districtCode,
    setDistrictCode: (d) => { setDistrictCode(d); setPage(0); },
    connectionStatus,
    setConnectionStatus: (c) => { setConnectionStatus(c); setPage(0); },
    showExtraFilters,
    setShowExtraFilters,
    page,
    setPage,
    size,
    setSize: (sz) => { setSize(sz); setPage(0); },
    handleReset,
    rows,
    summaryRows,
    totalElements,
    totalTurnoverSum,
    top5,
    distribution,
    nonFiscalAmount,
    notConnectedSellingCount: notConnectedSelling.length,
    notConnectedAmount,
    loading: allCompaniesQuery.isLoading,
    error: allCompaniesQuery.isError,
    regions: regionsQuery.data ?? [],
    districts: districtsQuery.data ?? [],
  };
}
