import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { geoApi, taxAnalyticsApi } from '../../../api';

const PERIODS = ['today', '7d', '30d', 'month', 'year'];
const FILTERS_KEY = 'platform.taxAnalytics.savedFilters';

const emptyDraft = () => ({
  regionCode: '',
  districtCode: '',
  connectionStatus: '',
  search: '',
  level: '',
});

export function useTaxAnalyticsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [page, setPage] = useState(0);
  const [regionView, setRegionView] = useState('cards'); // cards | table

  const overviewParams = useMemo(() => {
    if (customFrom && customTo) {
      return { period: 'custom', from: customFrom, to: customTo };
    }
    // Don't send period=custom until both dates are chosen (avoids API 400).
    if (period === 'custom') {
      return { period: '30d' };
    }
    return { period };
  }, [period, customFrom, customTo]);

  const resultsParams = useMemo(() => ({
    ...overviewParams,
    regionCode: applied.regionCode || undefined,
    districtCode: applied.districtCode || undefined,
    connectionStatus: applied.connectionStatus || undefined,
    search: applied.search?.trim() || undefined,
    level: applied.level || undefined,
    page,
    size: 20,
  }), [overviewParams, applied, page]);

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
      if (!raw) return;
      const parsed = { ...emptyDraft(), ...JSON.parse(raw) };
      setDraft(parsed);
      setApplied(parsed);
      setPage(0);
    } catch {
      /* ignore */
    }
  };

  const lang = i18n.language;
  const labelGeo = (row) => (lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz));

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
    results: resultsQuery.data,
    resultsLoading: resultsQuery.isPending,
    resultsError: resultsQuery.isError,
    districts: districtsQuery.data ?? [],
    selectRegion,
    applyFilters,
    resetFilters,
    saveFilters,
    loadSavedFilters,
  };
}
