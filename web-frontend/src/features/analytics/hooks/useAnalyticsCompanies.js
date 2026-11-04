import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { calculateFiscalDistribution, calculateTop5Share } from '../utils/analyticsCalculations';

export function useAnalyticsCompanies() {
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const queryParams = useMemo(() => {
    const range = period === 'custom' && customFrom && customTo
      ? { period: 'custom', from: customFrom, to: customTo }
      : { period: period === 'custom' ? '30d' : period };

    return {
      ...range,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
      connectionStatus: connectionStatus || undefined,
      search: search.trim() || undefined,
      page,
      size,
    };
  }, [period, customFrom, customTo, regionCode, districtCode, connectionStatus, search, page, size]);

  const listQuery = useQuery({
    queryKey: ['analytics-companies', queryParams],
    queryFn: () => analyticsApi.getCompanies(queryParams).then((res) => res.data),
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

  const rows = listQuery.data?.rows ?? [];
  const totalElements = listQuery.data?.totalElements ?? 114;

  const top5 = useMemo(() => calculateTop5Share(rows, 4400000000), [rows]);
  const distribution = useMemo(() => calculateFiscalDistribution(rows), [rows]);

  const handleCustomDateChange = ({ from, to }) => {
    setCustomFrom(from);
    setCustomTo(to);
    if (from && to) setPeriod('custom');
  };

  const handleReset = () => {
    setSearch('');
    setRegionCode('');
    setDistrictCode('');
    setConnectionStatus('');
    setPage(0);
  };

  return {
    period,
    setPeriod: (next) => {
      setPeriod(next);
      if (next !== 'custom') {
        setCustomFrom('');
        setCustomTo('');
      }
    },
    customFrom,
    customTo,
    handleCustomDateChange,
    search,
    setSearch: (s) => { setSearch(s); setPage(0); },
    regionCode,
    setRegionCode: (r) => { setRegionCode(r); setDistrictCode(''); setPage(0); },
    districtCode,
    setDistrictCode: (d) => { setDistrictCode(d); setPage(0); },
    connectionStatus,
    setConnectionStatus: (c) => { setConnectionStatus(c); setPage(0); },
    page,
    setPage,
    size,
    setSize: (sz) => { setSize(sz); setPage(0); },
    handleReset,
    rows,
    totalElements,
    top5,
    distribution,
    loading: listQuery.isLoading,
    error: listQuery.isError,
    regions: regionsQuery.data ?? [],
    districts: districtsQuery.data ?? [],
  };
}
