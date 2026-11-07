import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { analyticsApi } from '../api/analyticsApi';
import {
  fetchAllCompanies,
  weeksFromRepublicDays,
} from '../utils/analyticsCompanyLoader';
import { useAnalyticsPeriodStore } from './useAnalyticsPeriodStore';

function mapDailyRows(days = []) {
  return (days || []).map((d) => ({
    date: d.date,
    fiscalTurnover: Number(d.fiscalTurnover || 0),
    nonFiscalTurnover: Number(d.nonFiscalTurnover || 0),
    totalTurnover: Number(d.totalTurnover || 0),
    topCompany: d.leaderCompanyName || d.topCompany || null,
    leaderCompanyId: d.leaderCompanyId ?? null,
    maxCompanyTurnover: null,
  }));
}

export function useAnalyticsOverview() {
  const period = useAnalyticsPeriodStore((s) => s.period);
  const customFrom = useAnalyticsPeriodStore((s) => s.customFrom);
  const customTo = useAnalyticsPeriodStore((s) => s.customTo);
  const setPeriod = useAnalyticsPeriodStore((s) => s.setPeriod);
  const setCustomRange = useAnalyticsPeriodStore((s) => s.setCustomRange);
  const setBackendDates = useAnalyticsPeriodStore((s) => s.setBackendDates);

  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
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
      search: debouncedSearch.trim() || undefined,
    };
  }, [period, customFrom, customTo, selectedRegionCode, connectionStatus, debouncedSearch]);

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', queryParams],
    queryFn: () => analyticsApi.getOverview(queryParams).then((res) => res.data),
    placeholderData: (prev) => prev,
  });

  const dailyQuery = useQuery({
    queryKey: ['analytics-overview-daily', queryParams],
    queryFn: () => analyticsApi.getDaily(queryParams).then((res) => res.data),
    placeholderData: (prev) => prev,
  });

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-regions', queryParams],
    queryFn: () => analyticsApi.getResults({ ...queryParams, level: 'REGION', size: 100 }).then((res) => res.data),
    placeholderData: (prev) => prev,
  });

  const companiesQuery = useQuery({
    queryKey: ['analytics-top-companies', queryParams],
    queryFn: () => fetchAllCompanies(queryParams),
    placeholderData: (prev) => prev,
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => analyticsApi.getRegions().then((res) => res.data),
    staleTime: 600_000,
  });

  useEffect(() => {
    if (overviewQuery.data?.periodFrom && overviewQuery.data?.periodTo) {
      setBackendDates(overviewQuery.data.periodFrom, overviewQuery.data.periodTo);
    }
  }, [overviewQuery.data?.periodFrom, overviewQuery.data?.periodTo, setBackendDates]);

  const regionalRows = resultsQuery.data?.rows ?? [];
  const allCompanies = useMemo(() => {
    const list = companiesQuery.data?.rows ?? [];
    return [...list].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  }, [companiesQuery.data?.rows]);

  const totals = useMemo(() => {
    const kpiTotal = Number(overviewQuery.data?.kpi?.totalTurnover || 0);
    const sumCompaniesTotal = allCompanies.reduce((s, c) => s + Number(c.totalTurnover || 0), 0);
    const nonFiscalTurnover = allCompanies.reduce((s, c) => s + Number(c.nonFiscalTurnover || 0), 0);
    const effectiveTotal = kpiTotal > 0 ? kpiTotal : sumCompaniesTotal;
    const fiscalTurnover = Math.max(0, effectiveTotal - nonFiscalTurnover);
    const fiscalPct = effectiveTotal > 0 ? (fiscalTurnover / effectiveTotal) * 100 : 0;
    const nonFiscalPct = effectiveTotal > 0 ? (nonFiscalTurnover / effectiveTotal) * 100 : 0;

    return {
      totalTurnover: effectiveTotal,
      fiscalTurnover,
      nonFiscalTurnover,
      fiscalPct,
      nonFiscalPct,
    };
  }, [overviewQuery.data?.kpi?.totalTurnover, allCompanies]);

  const topRegions = useMemo(() => {
    return [...regionalRows].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
  }, [regionalRows]);

  const growingRegions = useMemo(() => {
    return regionalRows.filter((r) => Number(r.turnoverDeltaPct || 0) > 0);
  }, [regionalRows]);

  const decliningRegions = useMemo(() => {
    return regionalRows.filter((r) => Number(r.turnoverDeltaPct || 0) < 0);
  }, [regionalRows]);

  const top10Companies = useMemo(() => allCompanies.slice(0, 10), [allCompanies]);

  const republicDays = useMemo(
    () => mapDailyRows(dailyQuery.data?.days),
    [dailyQuery.data?.days]
  );

  const republicWeeks = useMemo(
    () => weeksFromRepublicDays(republicDays),
    [republicDays]
  );

  const topCompanyId = top10Companies[0]?.companyId;
  const topCompanyName = top10Companies[0]?.name ?? '';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRegionCode('');
    setConnectionStatus('');
  };

  const isLoading = overviewQuery.isLoading || resultsQuery.isLoading || dailyQuery.isLoading;
  const isError = overviewQuery.isError || resultsQuery.isError || dailyQuery.isError;

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
    allCompanies,
    republicDays,
    republicWeeks,
    topCompanyName,
    topCompanyId,
    loading: isLoading,
    error: isError,
    refetch: () => {
      overviewQuery.refetch();
      resultsQuery.refetch();
      companiesQuery.refetch();
      dailyQuery.refetch();
    },
    regions: regionsQuery.data ?? [],
  };
}
