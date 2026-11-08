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

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview-viloyatlar', period],
    queryFn: () => analyticsApi.getOverview({ period, regionCode: '18' }).then((r) => r.data),
    staleTime: 60_000,
  });

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-viloyatlar', period],
    queryFn: () => analyticsApi.getResults({ level: 'DISTRICT', regionCode: '18', period }).then((r) => r.data),
    staleTime: 60_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', '18'],
    queryFn: () => geoApi.districts('18').then((r) => r.data || []),
    staleTime: 600_000,
  });

  const overview = overviewQuery.data || {};
  const rangeLabel = overview.periodFrom && overview.periodTo
    ? `${fmtDayShort(overview.periodFrom)} – ${fmtDayShort(overview.periodTo)}`
    : (PERIOD_LABELS[period]?.label ?? '30 kun');

  const rawDistricts = useMemo(
    () => buildSamarqandDistricts(undefined, resultsQuery.data?.rows),
    [resultsQuery.data?.rows]
  );

  const counts = useMemo(() => ({
    all: rawDistricts.length,
    active: rawDistricts.filter((d) => d.hasCompanies).length,
    empty: rawDistricts.filter((d) => !d.hasCompanies).length,
  }), [rawDistricts]);

  const sortedDistricts = useMemo(
    () => filterAndSortDistricts(rawDistricts, filter, sort),
    [rawDistricts, filter, sort]
  );

  const kpis = useMemo(
    () => buildSamarqandKpis(rawDistricts, period, overview.kpi),
    [rawDistricts, period, overview.kpi]
  );

  const totalCompanies = useMemo(
    () => rawDistricts.reduce((acc, d) => acc + d.companies, 0),
    [rawDistricts]
  );

  const unassigned = useMemo(() => {
    const totalViloyatTurnover = Number(overview.kpi?.totalTurnover || 0);
    const sumDistrictsTurnover = rawDistricts.reduce((s, d) => s + (d.turnover || 0), 0);
    const unassignedTurnover = Math.max(0, totalViloyatTurnover - sumDistrictsTurnover);

    const totalViloyatComps = Number(overview.kpi?.totalEnterprises || overview.kpi?.enterprises || 0);
    const sumDistrictsComps = rawDistricts.reduce((s, d) => s + (d.companies || 0), 0);
    const unassignedCompanies = Math.max(0, totalViloyatComps - sumDistrictsComps);

    const totalViloyatConn = Number(overview.kpi?.connected || 0);
    const sumDistrictsConn = rawDistricts.reduce((s, d) => s + (d.connected || 0), 0);
    const unassignedConnected = Math.max(0, totalViloyatConn - sumDistrictsConn);

    const sharePct = totalViloyatTurnover > 0 ? (unassignedTurnover / totalViloyatTurnover) * 100 : 0;

    return {
      turnover: unassignedTurnover,
      companies: unassignedCompanies,
      connected: unassignedConnected,
      sharePct,
    };
  }, [overview.kpi, rawDistricts]);

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
    loading: overviewQuery.isLoading || districtsQuery.isLoading,
    error: overviewQuery.isError || districtsQuery.isError,
    refetch: () => {
      overviewQuery.refetch();
      resultsQuery.refetch();
      districtsQuery.refetch();
    },
  };
}

export default useViloyatlarAnalytics;
