import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { geoApi } from '../../../api';
import { taxAnalyticsCompaniesApi } from '../../../api/taxAnalyticsCompanies.api';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';

const PERIODS = ['today', '7d', '30d', 'month', 'year'];
const PAGE_SIZE = 20;

const emptyDraft = () => ({
  regionCode: '',
  districtCode: '',
  connectionStatus: '',
  search: '',
});

export function useCompanyAnalyticsList() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [page, setPage] = useState(0);

  const params = useMemo(() => {
    const range = period === 'custom' && customFrom && customTo
      ? { period: 'custom', from: customFrom, to: customTo }
      : { period: period === 'custom' ? '30d' : period };
    return {
      ...range,
      regionCode: applied.regionCode || undefined,
      districtCode: applied.districtCode || undefined,
      connectionStatus: applied.connectionStatus || undefined,
      search: applied.search?.trim() || undefined,
      page,
      size: PAGE_SIZE,
    };
  }, [period, customFrom, customTo, applied, page]);

  const listQuery = useQuery({
    queryKey: ['tax-analytics-companies', params],
    queryFn: () => taxAnalyticsCompaniesApi.list(params).then((response) => response.data),
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((response) => response.data),
    staleTime: 600_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', draft.regionCode],
    queryFn: () => geoApi.districts(draft.regionCode).then((response) => response.data),
    enabled: Boolean(draft.regionCode),
    staleTime: 600_000,
  });

  const lang = i18n.language;
  const labelGeo = (row) => {
    if (!row) return '';
    const raw = lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
    return cleanGeoName(raw);
  };

  return {
    t,
    periods: PERIODS,
    period,
    setPeriod: (next) => {
      setPeriod(next);
      if (next !== 'custom') {
        setCustomFrom('');
        setCustomTo('');
      }
      setPage(0);
    },
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    draft,
    setDraft,
    page,
    setPage,
    regions: regionsQuery.data ?? [],
    districts: districtsQuery.data ?? [],
    labelGeo,
    list: listQuery.data,
    loading: listQuery.isPending,
    error: listQuery.isError,
    applyFilters: () => {
      setApplied({ ...draft });
      setPage(0);
    },
    resetFilters: () => {
      const next = emptyDraft();
      setDraft(next);
      setApplied(next);
      setPage(0);
    },
  };
}
