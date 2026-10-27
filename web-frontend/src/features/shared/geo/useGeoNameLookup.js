import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { geoApi } from '../../../api/geo.api';

import { cleanGeoName } from './geoNameUtils';

function labelOf(row, lang) {
  if (!row) return '';
  const raw = lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
  return cleanGeoName(raw);
}

/**
 * Resolve SOATO region/district codes → display names.
 * Pass regionCodesPresent so districts are loaded for those regions only.
 */
export function useGeoNameLookup(regionCodesPresent = []) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const empty = t('geo.none');

  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data),
    staleTime: 600_000,
  });

  const uniqueRegions = useMemo(() => (
    [...new Set((regionCodesPresent || []).filter(Boolean).map(String))]
  ), [regionCodesPresent]);

  const districtQueries = useQueries({
    queries: uniqueRegions.map((code) => ({
      queryKey: ['geo-districts', code],
      queryFn: () => geoApi.districts(code).then((r) => r.data),
      staleTime: 600_000,
      enabled: Boolean(code),
    })),
  });

  const regionByCode = useMemo(() => {
    const map = new Map();
    regions.forEach((r) => map.set(String(r.code), r));
    return map;
  }, [regions]);

  const districtByCode = useMemo(() => {
    const map = new Map();
    districtQueries.forEach((q) => {
      (q.data || []).forEach((d) => map.set(String(d.code), d));
    });
    return map;
  }, [districtQueries]);

  const regionName = (code) => {
    if (!code) return empty;
    return labelOf(regionByCode.get(String(code)), lang) || String(code);
  };

  const districtName = (code) => {
    if (!code) return empty;
    return labelOf(districtByCode.get(String(code)), lang) || String(code);
  };

  return { regions, regionName, districtName, empty, lang };
}
