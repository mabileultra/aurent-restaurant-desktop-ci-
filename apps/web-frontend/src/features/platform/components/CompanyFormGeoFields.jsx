import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/aa/Select';
import { geoApi } from '../../../api/geo.api';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';

/**
 * CompanyFormGeoFields — Kompaniya formasidagi Viloyat va Tuman tanlash maydonlari.
 * Majburiy forma maydoni bo‘lgani sababli bo‘sh «…tanlang» varianti ro‘yxatga qo‘shilmaydi,
 * faqat triggerda placeholder sifatida ko‘rinadi.
 */
export default function CompanyFormGeoFields({
  regionCode = '',
  districtCode = '',
  regionError,
  districtError,
  onRegionChange,
  onDistrictChange,
}) {
  const { i18n } = useTranslation();
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

  const safeRegions = Array.isArray(regions) ? regions : Array.isArray(regions?.data) ? regions.data : [];
  const safeDistricts = Array.isArray(districts) ? districts : Array.isArray(districts?.data) ? districts.data : [];

  const regionOptions = safeRegions.map((r) => {
    const raw = lang?.startsWith('uz') ? (r.nameUz || r.nameRu) : (r.nameRu || r.nameUz);
    return { value: r.code, label: cleanGeoName(raw) };
  });

  const districtOptions = safeDistricts.map((d) => {
    const raw = lang?.startsWith('uz') ? (d.nameUz || d.nameRu) : (d.nameRu || d.nameUz);
    return { value: d.code, label: cleanGeoName(raw) };
  });

  return (
    <>
      <Select
        id="company-field-region"
        label="Viloyat"
        value={regionCode || ''}
        placeholder="Viloyatni tanlang"
        onChange={(val) => onRegionChange?.(val)}
        options={regionOptions}
        error={regionError}
      />
      <Select
        id="company-field-district"
        label="Tuman yoki shahar"
        value={districtCode || ''}
        placeholder={regionCode ? 'Tuman yoki shaharni tanlang' : 'Avval viloyatni tanlang'}
        disabled={!regionCode}
        onChange={(val) => onDistrictChange?.(val)}
        options={districtOptions}
        error={districtError}
      />
    </>
  );
}
