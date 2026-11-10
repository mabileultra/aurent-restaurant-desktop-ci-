import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { geoApi } from '../../../api/geo.api';
import { fmtDayShort } from '../utils/analyticsFormat';
import {
  buildSamarqandDistricts,
  filterAndSortDistricts,
  buildSamarqandKpis,
} from '../utils/samarqandDistrictsAnalytics';

const PERIOD_LABELS = {
  today: { label: 'Bugun', cmp: 'kechaga nisbatan' },
  '7d': { label: '7 kun', cmp: 'oldingi 7 kunga nisbatan' },
  '30d': { label: '30 kun', cmp: 'oldingi 30 kunga nisbatan' },
  month: { label: 'Shu oy', cmp: 'oldingi davrga nisbatan' },
  year: { label: 'Yil', cmp: 'o‘tgan yilga nisbatan' },
};

export function useViloyatlarAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('turnover');

  // Single results call carries district rows + region KPI summary (no second /overview flicker).
  const resultsQuery = useQuery({
    queryKey: ['analytics-results-viloyatlar', period],
    queryFn: () => analyticsApi.getResults({
      level: 'DISTRICT',
      regionCode: '18',
      period,
      size: 100,
    }).then((r) => r.data),
    staleTime: 60_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', '18'],
    queryFn: () => geoApi.districts('18').then((r) => r.data || []),
    staleTime: 600_000,
  });

  const results = resultsQuery.data || {};
  const rangeLabel = results.periodFrom && results.periodTo
    ? `${fmtDayShort(results.periodFrom)} – ${fmtDayShort(results.periodTo)}`
    : (PERIOD_LABELS[period]?.label ?? '30 kun');

  // Always pass an array so we never fall back to SAMARQAND_COMPANIES mock mid-load.
  const backendRows = Array.isArray(resultsQuery.data?.rows) ? resultsQuery.data.rows : [];

  const rawDistricts = useMemo(
    () => buildSamarqandDistricts([], backendRows),
    [backendRows]
  );

  const unassignedRow = useMemo(() => {
    return backendRows.find((r) => String(r.code || '').toUpperCase() === 'UNASSIGNED') || null;
  }, [backendRows]);

  const counts = useMemo(() => ({
    all: rawDistricts.length,
    active: rawDistricts.filter((d) => d.hasCompanies).length,
    empty: rawDistricts.filter((d) => !d.hasCompanies).length,
  }), [rawDistricts]);

  const sortedDistricts = useMemo(
    () => filterAndSortDistricts(rawDistricts, filter, sort),
    [rawDistricts, filter, sort]
  );

  const kpis = useMemo(() => {
    // Only paint KPIs from backend summary — never mock, never district-sum while summary pending.
    if (!resultsQuery.isSuccess || !results.summary) {
      return buildSamarqandKpis([], period, null);
    }
    return buildSamarqandKpis(rawDistricts, period, results.summary);
  }, [resultsQuery.isSuccess, results.summary, rawDistricts, period]);

  const totalCompanies = useMemo(() => {
    if (!resultsQuery.isSuccess) return 0;
    const fromSummary = Number(results.summary?.totalEnterprises || 0);
    if (fromSummary > 0) return fromSummary;
    return rawDistricts.reduce((acc, d) => acc + d.companies, 0)
      + Number(unassignedRow?.enterprises || 0);
  }, [resultsQuery.isSuccess, results.summary, rawDistricts, unassignedRow]);

  const unassigned = useMemo(() => {
    if (!resultsQuery.isSuccess) {
      return { turnover: 0, companies: 0, connected: 0, sharePct: 0 };
    }
    if (unassignedRow) {
      const turnover = Number(unassignedRow.totalTurnover || 0);
      const companies = Number(unassignedRow.enterprises || 0);
      const connected = Number(unassignedRow.connected || 0);
      const totalViloyatTurnover = Number(results.summary?.totalTurnover || 0);
      return {
        turnover,
        companies,
        connected,
        sharePct: totalViloyatTurnover > 0 ? (turnover / totalViloyatTurnover) * 100 : 0,
      };
    }
    const totalViloyatTurnover = Number(results.summary?.totalTurnover || 0);
    const sumDistrictsTurnover = rawDistricts.reduce((s, d) => s + (d.turnover || 0), 0);
    const unassignedTurnover = Math.max(0, totalViloyatTurnover - sumDistrictsTurnover);
    const totalViloyatComps = Number(results.summary?.totalEnterprises || 0);
    const sumDistrictsComps = rawDistricts.reduce((s, d) => s + (d.companies || 0), 0);
    const unassignedCompanies = Math.max(0, totalViloyatComps - sumDistrictsComps);
    const totalViloyatConn = Number(results.summary?.connected || 0);
    const sumDistrictsConn = rawDistricts.reduce((s, d) => s + (d.connected || 0), 0);
    const unassignedConnected = Math.max(0, totalViloyatConn - sumDistrictsConn);
    return {
      turnover: unassignedTurnover,
      companies: unassignedCompanies,
      connected: unassignedConnected,
      sharePct: totalViloyatTurnover > 0 ? (unassignedTurnover / totalViloyatTurnover) * 100 : 0,
    };
  }, [resultsQuery.isSuccess, unassignedRow, results.summary, rawDistricts]);

  return {
    period,
    setPeriod,
    rangeLabel,
    kpis,
    filter,
    setFilter,
    counts,
    sort,
    setSort,
    regions: sortedDistricts,
    unassigned,
    totalCompanies,
    loading: resultsQuery.isLoading || districtsQuery.isLoading,
    error: resultsQuery.isError || districtsQuery.isError,
    refetch: () => {
      resultsQuery.refetch();
      districtsQuery.refetch();
    },
  };
}

export default useViloyatlarAnalytics;
