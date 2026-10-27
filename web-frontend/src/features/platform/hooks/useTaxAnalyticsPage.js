import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { geoApi, taxAnalyticsApi } from '../../../api';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';

const PERIODS = ['today', '7d', '30d', 'month', 'year'];
const FILTERS_KEY = 'platform.taxAnalytics.savedFilters';
const PAGE_SIZE = 20;

export const emptyDraft = () => ({
  regionCode: '',
  districtCode: '',
  enterpriseType: '',
  activitySubtype: '',
  connectionStatus: '',
  activityStatus: '',
  connectionFrom: '',
  connectionTo: '',
  turnoverFrom: '',
  turnoverTo: '',
  turnoverMin: '',
  turnoverMax: '',
  fiscalShareMin: '',
  fiscalShareMax: '',
  dynamics: '',
  hasErrors: '',
  lastActivityFrom: '',
  lastActivityTo: '',
  search: '',
  level: '',
});

function numOrNull(v) {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasClientOnlyFilters(applied) {
  return Boolean(
    numOrNull(applied.turnoverMin) != null
    || numOrNull(applied.turnoverMax) != null
    || numOrNull(applied.fiscalShareMin) != null
    || numOrNull(applied.fiscalShareMax) != null
    || applied.dynamics
  );
}

/** Client-side filters on rows already returned by the API. */
export function applyClientRowFilters(rows, applied) {
  if (!rows?.length) return [];
  const tMin = numOrNull(applied.turnoverMin);
  const tMax = numOrNull(applied.turnoverMax);
  const fsMin = numOrNull(applied.fiscalShareMin);
  const fsMax = numOrNull(applied.fiscalShareMax);

  return rows.filter((row) => {
    const total = Number(row.totalTurnover ?? 0);
    if (tMin != null && total < tMin) return false;
    if (tMax != null && total > tMax) return false;

    const share = row.fiscalSharePct == null ? null : Number(row.fiscalSharePct);
    if (fsMin != null && (share == null || share < fsMin)) return false;
    if (fsMax != null && (share == null || share > fsMax)) return false;

    const delta = row.turnoverDeltaPct == null ? null : Number(row.turnoverDeltaPct);
    if (applied.dynamics === 'UP' && !(delta != null && delta > 0)) return false;
    if (applied.dynamics === 'DOWN' && !(delta != null && delta < 0)) return false;
    if (applied.dynamics === 'FLAT' && !(delta == null || delta === 0)) return false;

    return true;
  });
}

function exportRowsCsv(rows, lang, filename) {
  const headers = [
    '#', 'code', 'name', 'enterprises', 'connected', 'notConnected',
    'fiscalTurnover', 'nonFiscalTurnover', 'totalTurnover', 'fiscalSharePct', 'turnoverDeltaPct', 'level',
  ];
  const lines = [headers.join(';')];
  rows.forEach((row, i) => {
    const name = lang?.startsWith('uz') ? row.nameUz : row.nameRu;
    lines.push([
      i + 1,
      row.code,
      `"${String(name ?? '').replace(/"/g, '""')}"`,
      row.enterprises,
      row.connected,
      row.notConnected,
      row.fiscalTurnover,
      row.nonFiscalTurnover,
      row.totalTurnover,
      row.fiscalSharePct,
      row.turnoverDeltaPct,
      row.level,
    ].join(';'));
  });
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useTaxAnalyticsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [page, setPage] = useState(0);
  const [regionView, setRegionView] = useState('cards');

  const clientFilter = hasClientOnlyFilters(applied);

  const overviewParams = useMemo(() => {
    if (applied.turnoverFrom && applied.turnoverTo) {
      return { period: 'custom', from: applied.turnoverFrom, to: applied.turnoverTo };
    }
    if (customFrom && customTo) {
      return { period: 'custom', from: customFrom, to: customTo };
    }
    if (period === 'custom') {
      return { period: '30d' };
    }
    return { period };
  }, [period, customFrom, customTo, applied.turnoverFrom, applied.turnoverTo]);

  const resultsParams = useMemo(() => ({
    ...overviewParams,
    regionCode: applied.regionCode || undefined,
    districtCode: applied.districtCode || undefined,
    connectionStatus: applied.connectionStatus || undefined,
    search: applied.search?.trim() || undefined,
    level: applied.level || undefined,
    page: clientFilter ? 0 : page,
    size: clientFilter ? 100 : PAGE_SIZE,
  }), [overviewParams, applied, page, clientFilter]);

  const overviewQuery = useQuery({
    queryKey: ['tax-analytics-overview', overviewParams],
    queryFn: () => taxAnalyticsApi.overview(overviewParams).then((r) => r.data),
  });

  const resultsQuery = useQuery({
    queryKey: ['tax-analytics-results', resultsParams],
    queryFn: () => taxAnalyticsApi.results(resultsParams).then((r) => r.data),
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', draft.regionCode],
    queryFn: () => geoApi.districts(draft.regionCode).then((r) => r.data),
    enabled: Boolean(draft.regionCode),
    staleTime: 600_000,
  });

  const displayResults = useMemo(() => {
    const data = resultsQuery.data;
    if (!data) return undefined;
    const filtered = applyClientRowFilters(data.rows ?? [], applied);
    if (!clientFilter) {
      return { ...data, rows: filtered };
    }
    const total = filtered.length;
    const from = Math.min(page * PAGE_SIZE, total);
    const to = Math.min(from + PAGE_SIZE, total);
    return {
      ...data,
      rows: filtered.slice(from, to),
      totalElements: total,
      size: PAGE_SIZE,
      page,
    };
  }, [resultsQuery.data, applied, clientFilter, page]);

  const selectRegion = (regionCode) => {
    const next = {
      ...draft,
      regionCode: draft.regionCode === regionCode ? '' : regionCode,
      districtCode: '',
      level: '',
    };
    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const applyFilters = () => {
    setApplied({ ...draft });
    setPage(0);
  };

  const resetFilters = () => {
    const next = emptyDraft();
    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const saveFilters = () => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(draft));
      toast.success(t('platform.analytics.filterSaved'));
    } catch {
      toast.error(t('platform.analytics.filterSaveFailed'));
    }
  };

  const loadSavedFilters = () => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (!raw) {
        toast.error(t('platform.analytics.filterLoadEmpty'));
        return;
      }
      const parsed = { ...emptyDraft(), ...JSON.parse(raw) };
      setDraft(parsed);
      setApplied(parsed);
      setPage(0);
      toast.success(t('platform.analytics.filterLoaded'));
    } catch {
      toast.error(t('platform.analytics.filterSaveFailed'));
    }
  };

  const exportExcel = () => {
    const rows = applyClientRowFilters(resultsQuery.data?.rows ?? [], applied);
    if (!rows.length) {
      toast.error(t('platform.analytics.exportEmpty'));
      return;
    }
    exportRowsCsv(rows, i18n.language, `tax-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t('platform.analytics.exportDone'));
  };

  const lang = i18n.language;
  const labelGeo = (row) => {
    if (!row) return '';
    const raw = lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
    return cleanGeoName(raw);
  };

  return {
    t,
    lang,
    labelGeo,
    periods: PERIODS,
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    draft,
    setDraft,
    applied,
    page,
    setPage,
    regionView,
    setRegionView,
    overview: overviewQuery.data,
    overviewLoading: overviewQuery.isPending,
    overviewError: overviewQuery.isError,
    results: displayResults,
    resultsLoading: resultsQuery.isPending,
    resultsError: resultsQuery.isError,
    districts: districtsQuery.data ?? [],
    selectRegion,
    applyFilters,
    resetFilters,
    saveFilters,
    loadSavedFilters,
    exportExcel,
  };
}
