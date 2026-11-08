import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { geoApi } from '../../../api/geo.api';
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
    queryFn: () => analyticsApi.getOverview({ period }).then((r) => r.data),
    staleTime: 60_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', '18'],
    queryFn: () => geoApi.districts('18').then((r) => r.data || []),
    staleTime: 600_000,
  });

  const overview = overviewQuery.data || {};
  const rangeLabel = overview.periodFrom && overview.periodTo
    ? `${overview.periodFrom} – ${overview.periodTo}`
    : (period === '30d' ? '2026-10-10 – 2026-11-08' : (PERIOD_LABELS[period]?.label ?? '30 kun'));

  const rawDistricts = useMemo(() => buildSamarqandDistricts(), []);

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
    () => buildSamarqandKpis(rawDistricts, period),
    [rawDistricts, period]
  );

  const totalCompanies = useMemo(
    () => rawDistricts.reduce((acc, d) => acc + d.companies, 0),
    [rawDistricts]
  );

  const unassigned = useMemo(() => ({
    turnover: 0,
    companies: 0,
    connected: 0,
    sharePct: 0,
  }), []);

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
      districtsQuery.refetch();
    },
  };
}

export default useViloyatlarAnalytics;
