import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { geoApi } from '../../../api/geo.api';
import { fmtMoney, fmtPercent, sanitizeText } from '../utils/analyticsFormat';

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

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-regions-viloyatlar', period],
    queryFn: () => analyticsApi.getResults({ period, level: 'REGION', size: 100 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data || []),
    staleTime: 600_000,
  });

  const overview = overviewQuery.data || {};
  const kpi = overview.kpi || {};
  const regionalResults = resultsQuery.data?.rows || [];
  const baseRegions = regionsQuery.data || [];
  const rangeLabel = overview.periodFrom && overview.periodTo
    ? `${overview.periodFrom} – ${overview.periodTo}`
    : (PERIOD_LABELS[period]?.label ?? '30 kun');

  const { resultMap, ovrMap } = useMemo(() => {
    const rMap = new Map();
    const oMap = new Map();
    regionalResults.forEach((row) => rMap.set(String(row.regionCode || row.code || '').padStart(2, '0'), row));
    (overview.regions || []).forEach((r) => oMap.set(String(r.code || r.regionCode || '').padStart(2, '0'), r));
    return { resultMap: rMap, ovrMap: oMap };
  }, [regionalResults, overview.regions]);

  const normalizedRegions = useMemo(() => baseRegions.map((base) => {
    const code = String(base.code || '').padStart(2, '0');
    const res = resultMap.get(code) || {};
    const ovr = ovrMap.get(code) || {};
    const companies = Number(res.enterprises ?? ovr.enterprises ?? 0);
    const connected = Number(res.connected ?? ovr.connected ?? 0);
    const turnover = Number(res.totalTurnover ?? ovr.totalTurnover ?? 0);
    const fiscalTurnover = Number(res.fiscalTurnover ?? ovr.fiscalTurnover ?? 0);
    const fiscalSharePct = res.fiscalSharePct != null
      ? Number(res.fiscalSharePct)
      : (turnover > 0 ? (fiscalTurnover / turnover) * 100 : null);

    return {
      code,
      name: sanitizeText(base.nameUz || base.nameRu || 'Viloyat'),
      companies,
      connected,
      turnover,
      fiscalTurnover,
      fiscalSharePct,
      turnoverDeltaPct: res.turnoverDeltaPct != null ? Number(res.turnoverDeltaPct) : null,
      hasCompanies: companies > 0,
    };
  }), [baseRegions, resultMap, ovrMap]);

  const assignedTotals = useMemo(() => normalizedRegions.reduce((acc, r) => {
    acc.turnover += r.turnover;
    acc.companies += r.companies;
    acc.connected += r.connected;
    return acc;
  }, { turnover: 0, companies: 0, connected: 0 }), [normalizedRegions]);

  const totalTurnover = Number(kpi.totalTurnover || assignedTotals.turnover);
  const totalCompanies = Number(kpi.totalEnterprises || assignedTotals.companies);
  const totalConnected = Number(kpi.connectedEnterprises || assignedTotals.connected);
  const newConnections = Number(kpi.newConnections || 0);

  const unassigned = useMemo(() => {
    const unT = Math.max(0, totalTurnover - assignedTotals.turnover);
    const unC = Math.max(0, totalCompanies - assignedTotals.companies);
    const unConn = Math.max(0, totalConnected - assignedTotals.connected);
    return {
      turnover: unT,
      companies: unC,
      connected: unConn,
      sharePct: unC > 0 ? Math.round((unConn / unC) * 1000) / 10 : 0,
    };
  }, [totalTurnover, assignedTotals, totalCompanies, totalConnected]);

  const counts = useMemo(() => ({
    all: normalizedRegions.length,
    active: normalizedRegions.filter((r) => r.hasCompanies).length,
    empty: normalizedRegions.filter((r) => !r.hasCompanies).length,
  }), [normalizedRegions]);

  const sortedRegions = useMemo(() => {
    const filtered = normalizedRegions.filter((r) => {
      if (filter === 'active') return r.hasCompanies;
      if (filter === 'empty') return !r.hasCompanies;
      return true;
    });
    const byName = (a, b) => a.name.localeCompare(b.name, 'uz');
    const ratio = (r) => (r.companies ? r.connected / r.companies : -1);

    return [...filtered].sort((a, b) => {
      if (sort === 'companies') return (b.companies - a.companies) || (b.turnover - a.turnover) || byName(a, b);
      if (sort === 'connected') return (ratio(b) - ratio(a)) || (b.companies - a.companies) || byName(a, b);
      if (sort === 'name') return byName(a, b);
      return (b.turnover - a.turnover) || (b.companies - a.companies) || byName(a, b);
    });
  }, [normalizedRegions, filter, sort]);

  const kpis = useMemo(() => [
    {
      label: 'Umumiy aylanma',
      value: fmtMoney(totalTurnover),
      delta: kpi.turnoverDeltaPct != null ? Number(kpi.turnoverDeltaPct) : null,
      hint: PERIOD_LABELS[period]?.cmp || 'oldingi davrga nisbatan',
    },
    {
      label: 'Jami korxonalar',
      value: String(totalCompanies),
      hint: `${assignedTotals.companies} tasi viloyatga biriktirilgan, ${unassigned.companies} tasi — yo‘q`,
    },
    {
      label: 'Ulangan korxonalar',
      value: String(totalConnected),
      badgeText: totalCompanies > 0 ? fmtPercent((totalConnected / totalCompanies) * 100) : '0%',
      hint: `${Math.max(0, totalCompanies - totalConnected)} ta korxona hali ulanmagan`,
    },
    {
      label: 'Yangi ulanishlar',
      value: String(newConnections),
      delta: kpi.newConnectionsDeltaPct != null ? Number(kpi.newConnectionsDeltaPct) : null,
      hint: 'Tanlangan davrda',
    },
  ], [totalTurnover, kpi.turnoverDeltaPct, kpi.newConnectionsDeltaPct, totalCompanies, assignedTotals, unassigned.companies, totalConnected, newConnections, period]);

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
    regions: sortedRegions,
    unassigned,
    totalCompanies,
    loading: overviewQuery.isLoading || resultsQuery.isLoading || regionsQuery.isLoading,
    error: overviewQuery.isError || resultsQuery.isError || regionsQuery.isError,
    refetch: () => {
      overviewQuery.refetch();
      resultsQuery.refetch();
      regionsQuery.refetch();
    },
  };
}
