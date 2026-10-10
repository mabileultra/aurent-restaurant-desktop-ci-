import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../components/ui';
import { geoApi } from '../../../api/geo.api';

function regionLabel(row, lang) {
  return lang?.startsWith('uz') ? (row.nameUz || row.nameRu) : (row.nameRu || row.nameUz);
}

/**
 * Controlled region + district SOATO selects.
 * onChange({ regionCode, districtCode }) — district cleared when region changes.
 */
export default function RegionDistrictFields({
  regionCode = '',
  districtCode = '',
  onChange,
  required = true,
  className = 'mb-3',
  regionError,
  districtError,
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

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <BaseSelect
        label={t('geo.region')}
        required={required}
        value={regionCode || ''}
        disabled={regionsLoading}
        error={regionError}
        placeholder={t('geo.selectRegion')}
        onChange={(e) => onChange?.({ regionCode: e.target.value, districtCode: '' })}
        options={[
          { value: '', label: t('geo.selectRegion') },
          ...regions.map((r) => ({ value: r.code, label: regionLabel(r, lang) })),
        ]}
      />
      <BaseSelect
        label={t('geo.district')}
        required={required}
        value={districtCode || ''}
        disabled={!regionCode || districtsLoading}
        error={districtError}
        placeholder={regionCode ? t('geo.selectDistrict') : t('geo.selectRegionFirst')}
        onChange={(e) => onChange?.({ regionCode, districtCode: e.target.value })}
        options={[
          { value: '', label: regionCode ? t('geo.selectDistrict') : t('geo.selectRegionFirst') },
          ...districts.map((d) => ({ value: d.code, label: regionLabel(d, lang) })),
        ]}
      />
    </div>
  );
}
