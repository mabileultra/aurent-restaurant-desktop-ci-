import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { calculateResultsTotals } from '../utils/analyticsCalculations';
import { useAnalyticsPeriodStore } from './useAnalyticsPeriodStore';

export function useAnalyticsOverview() {
  const period = useAnalyticsPeriodStore((s) => s.period);
  const customFrom = useAnalyticsPeriodStore((s) => s.customFrom);
  const customTo = useAnalyticsPeriodStore((s) => s.customTo);
  const setPeriod = useAnalyticsPeriodStore((s) => s.setPeriod);
  const setCustomRange = useAnalyticsPeriodStore((s) => s.setCustomRange);
  const setBackendDates = useAnalyticsPeriodStore((s) => s.setBackendDates);

  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [search, setSearch] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [showExtraFilters, setShowExtraFilters] = useState(false);

  const queryParams = useMemo(() => {
    const p = period === 'custom' && customFrom && customTo
      ? { period: 'custom', from: customFrom, to: customTo }
      : { period: period === 'custom' ? '30d' : period };

    return {
      ...p,
      regionCode: selectedRegionCode || undefined,
      connectionStatus: connectionStatus || undefined,
      search: search.trim() || undefined,
    };
  }, [period, customFrom, customTo, selectedRegionCode, connectionStatus, search]);

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', queryParams],
    queryFn: () => analyticsApi.getOverview(queryParams).then((res) => res.data),
  });

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-regions', queryParams],
    queryFn: () => analyticsApi.getResults({ ...queryParams, level: 'REGION', size: 100 }).then((res) => res.data),
  });

  const companiesQuery = useQuery({
    queryKey: ['analytics-top-companies', queryParams],
    queryFn: () => analyticsApi.getCompanies({ ...queryParams, size: 100 }).then((res) => res.data),
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => analyticsApi.getRegions().then((res) => res.data),
    staleTime: 600_000,
  });

  // Sync backend dates to period store when overview data arrives
  useEffect(() => {
    if (overviewQuery.data?.periodFrom && overviewQuery.data?.periodTo) {
      setBackendDates(overviewQuery.data.periodFrom, overviewQuery.data.periodTo);
    }
  }, [overviewQuery.data?.periodFrom, overviewQuery.data?.periodTo, setBackendDates]);

  // Real fiscal / non-fiscal sums from regional results
  const regionalRows = resultsQuery.data?.rows ?? [];
  const totals = useMemo(() => calculateResultsTotals(regionalRows), [regionalRows]);

  // Sort top regions by total turnover
  const topRegions = useMemo(() => {
    return [...regionalRows].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  }, [regionalRows]);

  const growingRegions = useMemo(() => {
    return regionalRows.filter((r) => Number(r.turnoverDeltaPct || 0) > 0);
  }, [regionalRows]);

  const decliningRegions = useMemo(() => {
    return regionalRows.filter((r) => Number(r.turnoverDeltaPct || 0) < 0);
  }, [regionalRows]);

  // Real TOP 10 companies sorted descending by totalTurnover
  const top10Companies = useMemo(() => {
    const list = companiesQuery.data?.rows ?? [];
    return [...list]
      .sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0))
      .slice(0, 10);
  }, [companiesQuery.data?.rows]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRegionCode('');
    setConnectionStatus('');
  };

  const isLoading = overviewQuery.isLoading || resultsQuery.isLoading;
  const isError = overviewQuery.isError || resultsQuery.isError;

  return {
    period,
    setPeriod,
    customFrom,
    customTo,
    handleCustomDateChange: setCustomRange,
    selectedRegionCode,
    setSelectedRegionCode,
    search,
    setSearch,
    connectionStatus,
    setConnectionStatus,
    showExtraFilters,
    setShowExtraFilters,
    handleResetFilters,
    overview: overviewQuery.data,
    kpi: overviewQuery.data?.kpi,
    totals,
    topRegions,
    growingRegions,
    decliningRegions,
    top10Companies,
    loading: isLoading,
    error: isError,
    refetch: () => {
      overviewQuery.refetch();
      resultsQuery.refetch();
      companiesQuery.refetch();
    },
    regions: regionsQuery.data ?? [],
  };
}
