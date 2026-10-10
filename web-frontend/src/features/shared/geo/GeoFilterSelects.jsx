import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { geoApi } from '../../../api/geo.api';

function labelOf(row, lang) {
  return lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
}

/** Compact region + district selects for list filter bars. */
export default function GeoFilterSelects({
  regionCode = '',
  districtCode = '',
  onChange,
  className = 'platform-filter-bar__geo',
  selectClassName = 'platform-filter-bar__select',
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data),
    staleTime: 600_000,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['geo-districts', regionCode],
    queryFn: () => geoApi.districts(regionCode).then((r) => r.data),
    enabled: Boolean(regionCode),
    staleTime: 600_000,
  });

  return (
    <div className={className}>
      <select
        className={selectClassName}
        value={regionCode || ''}
        aria-label={t('geo.region')}
        onChange={(e) => onChange?.({ regionCode: e.target.value, districtCode: '' })}
      >
        <option value="">{t('platform.analytics.allRegions')}</option>
        {regions.map((r) => (
          <option key={r.code} value={r.code}>{labelOf(r, lang)}</option>
        ))}
      </select>
      <select
        className={selectClassName}
        value={districtCode || ''}
        disabled={!regionCode}
        aria-label={t('geo.district')}
        onChange={(e) => onChange?.({ regionCode, districtCode: e.target.value })}
      >
        <option value="">{t('platform.analytics.allDistricts')}</option>
        {districts.map((d) => (
          <option key={d.code} value={d.code}>{labelOf(d, lang)}</option>
        ))}
      </select>
    </div>
  );
}
