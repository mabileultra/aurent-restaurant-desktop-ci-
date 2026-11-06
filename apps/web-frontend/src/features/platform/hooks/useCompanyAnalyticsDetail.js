import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { taxAnalyticsCompaniesApi } from '../../../api/taxAnalyticsCompanies.api';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';

const PERIODS = ['today', '7d', '30d', 'month', 'year'];

export function useCompanyAnalyticsDetail() {
  const { t, i18n } = useTranslation();
  const { companyId } = useParams();
  const id = Number(companyId);
  const validId = Number.isInteger(id) && id > 0;
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const selectPeriod = (next) => {
    setPeriod(next);
    if (next !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  };

  const params = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) return { period: 'custom', from: customFrom, to: customTo };
    if (period === 'custom') return { period: '30d' };
    return { period };
  }, [period, customFrom, customTo]);

  const detailQuery = useQuery({
    queryKey: ['tax-analytics-company', id, params],
    queryFn: () => taxAnalyticsCompaniesApi.detail(id, params).then((response) => response.data),
    enabled: validId,
  });

  const lang = i18n.language;
  const labelGeo = (nameRu, nameUz) => {
    const raw = lang?.startsWith('uz') ? (nameUz || nameRu) : (nameRu || nameUz);
    return cleanGeoName(raw);
  };

  return {
    t,
    companyId: validId ? id : null,
    validId,
    periods: PERIODS,
    period,
    setPeriod: selectPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    detail: detailQuery.data,
    loading: detailQuery.isPending,
    error: !validId || detailQuery.isError,
    labelGeo,
  };
}
