import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { BaseSelect } from '../../../components/ui';
import { geoApi } from '../../../api/geo.api';
import { cleanGeoName } from './geoNameUtils';

function labelOf(row, lang) {
  if (!row) return '';
  const raw = lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
  return cleanGeoName(raw);
}

/** Compact region + district selects for list filter bars. */
export default function GeoFilterSelects({
  regionCode = '',
  districtCode = '',
  onChange,
  className = 'platform-filter-bar__geo',
  selectClassName = '',
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { data: regions = [], isPending: regionsLoading } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data),
    staleTime: 600_000,
  });

  const { data: districts = [], isPending: districtsLoading } = useQuery({
    queryKey: ['geo-districts', regionCode],
    queryFn: () => geoApi.districts(regionCode).then((r) => r.data),
    enabled: Boolean(regionCode),
    staleTime: 600_000,
  });

  const allRegionsLabel = t('platform.analytics.allRegions', { defaultValue: 'Barcha viloyatlar' });
  const allDistrictsLabel = t('platform.analytics.allDistricts', { defaultValue: 'Barcha tumanlar' });

  const regionOptions = [
    { value: '', label: allRegionsLabel },
    ...regions.map((r) => ({ value: r.code, label: labelOf(r, lang) })),
  ];

  const districtOptions = [
    { value: '', label: allDistrictsLabel },
    ...districts.map((d) => ({ value: d.code, label: labelOf(d, lang) })),
  ];

  return (
    <div className={className}>
      <BaseSelect
        size="sm"
        searchable
        disabled={regionsLoading}
        className={clsx('geo-filter-select', selectClassName, regionCode && 'base-select--active-filter')}
        value={regionCode || ''}
        placeholder={allRegionsLabel}
        aria-label={t('geo.region')}
        onChange={(e) => onChange?.({ regionCode: e.target.value, districtCode: '' })}
        options={regionOptions}
      />
      <BaseSelect
        size="sm"
        searchable
        disabled={!regionCode || districtsLoading}
        className={clsx('geo-filter-select', selectClassName, districtCode && 'base-select--active-filter')}
        value={districtCode || ''}
        placeholder={allDistrictsLabel}
        aria-label={t('geo.district')}
        onChange={(e) => onChange?.({ regionCode, districtCode: e.target.value })}
        options={districtOptions}
      />
    </div>
  );
}

