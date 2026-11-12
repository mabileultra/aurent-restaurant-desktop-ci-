import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import Segmented from '../../../components/aa/Segmented';
import SearchInput from '../../../components/aa/SearchInput';
import Select from '../../../components/aa/Select';
import Button from '../../../components/aa/Button';
import { geoApi } from '../../../api/geo.api';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';

/**
 * PlatformCompanyToolbar — Kompaniyalar ro‘yxati asboblar paneli.
 * 1-qator: Segmented (Barchasi, Faol, Nofaol) + son/natija matni.
 * 2-qator: Qidiruv + Faoliyat turi + Viloyat + Tuman + Tozalash.
 */
export default function PlatformCompanyToolbar({
  statusFilter = 'ALL',
  onStatusFilterChange,
  totalCompanies = 0,
  activeCompanies = 0,
  inactiveCompanies = 0,
  totalResults = 0,
  isPending = false,
  search = '',
  onSearchChange,
  businessType = '',
  onBusinessTypeChange,
  businessTypes = [],
  regionCode = '',
  districtCode = '',
  onGeoChange,
  onReset,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Viloyatlar ro‘yxati
  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data),
    staleTime: 600_000,
  });

  // Tumanlar ro‘yxati (viloyat tanlanganda)
  const { data: districts = [] } = useQuery({
    queryKey: ['geo-districts', regionCode],
    queryFn: () => geoApi.districts(regionCode).then((r) => r.data),
    enabled: Boolean(regionCode),
    staleTime: 600_000,
  });

  const hasFilter = Boolean(
    search ||
    businessType ||
    regionCode ||
    districtCode ||
    statusFilter !== 'ALL'
  );

  const segmentedOptions = [
    { value: 'ALL', label: 'Barchasi', count: isPending ? '—' : totalCompanies },
    { value: 'ACTIVE', label: 'Faol', count: isPending ? '—' : activeCompanies },
    { value: 'INACTIVE', label: 'Nofaol', count: isPending ? '—' : inactiveCompanies },
  ];

  const safeBusinessTypes = Array.isArray(businessTypes)
    ? businessTypes
    : Array.isArray(businessTypes?.data)
      ? businessTypes.data
      : [];

  const businessTypeOptions = [
    { value: '', label: 'Barcha faoliyat turlari' },
    ...safeBusinessTypes.map((bt) => ({
      value: bt.code,
      label: t(`productTemplates.businessTypes.${bt.code}`, { defaultValue: bt.name }),
    })),
  ];

  const safeRegions = Array.isArray(regions) ? regions : Array.isArray(regions?.data) ? regions.data : [];
  const safeDistricts = Array.isArray(districts) ? districts : Array.isArray(districts?.data) ? districts.data : [];

  const regionOptions = [
    { value: '', label: 'Barcha viloyatlar' },
    ...safeRegions.map((r) => {
      const raw = lang?.startsWith('uz') ? (r.nameUz || r.nameRu) : (r.nameRu || r.nameUz);
      return { value: r.code, label: cleanGeoName(raw) };
    }),
  ];

  const districtOptions = [
    { value: '', label: regionCode ? 'Barcha tumanlar' : 'Avval viloyatni tanlang' },
    ...safeDistricts.map((d) => {
      const raw = lang?.startsWith('uz') ? (d.nameUz || d.nameRu) : (d.nameRu || d.nameUz);
      return { value: d.code, label: cleanGeoName(raw) };
    }),
  ];

  const countText = isPending
    ? '—'
    : hasFilter
      ? `${totalResults} ta natija`
      : `${totalCompanies} ta kompaniya`;

  return (
    <div className="p-4 aa-desktop:px-5 border-b border-aa-line space-y-3">
      {/* 1-qator: Segmented va son */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Segmented
          pill
          options={segmentedOptions}
          value={statusFilter}
          onChange={onStatusFilterChange}
          aria-label="Holat bo‘yicha filtr"
        />
        <span className="text-[13px] text-aa-ink-muted tabular-nums self-end sm:self-center">
          {countText}
        </span>
      </div>

      {/* 2-qator: Qidiruv va tanlovlar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Qidiruv */}
        <div className="flex-[1_1_240px] min-w-[240px] w-full aa-desktop:w-auto">
          <label htmlFor="company-search-input" className="sr-only">
            Qidirish
          </label>
          <SearchInput
            id="company-search-input"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Nomi, kirish kodi, STIR yoki telefon"
            className="w-full text-sm"
          />
        </div>

        {/* Faoliyat turi: flex 0 1 200px, min 160px */}
        <div className="w-full aa-desktop:w-auto aa-desktop:flex-[0_1_200px] aa-desktop:min-w-[160px]">
          <label htmlFor="company-business-type-select" className="sr-only">
            Faoliyat turi
          </label>
          <Select
            id="company-business-type-select"
            value={businessType}
            onChange={(val) => onBusinessTypeChange?.(val)}
            options={businessTypeOptions}
            className="w-full text-sm"
          />
        </div>

        {/* Viloyat: flex 0 1 200px, min 160px */}
        <div className="w-full aa-desktop:w-auto aa-desktop:flex-[0_1_200px] aa-desktop:min-w-[160px]">
          <label htmlFor="company-region-select" className="sr-only">
            Viloyat
          </label>
          <Select
            id="company-region-select"
            value={regionCode}
            onChange={(val) => onGeoChange?.({ regionCode: val, districtCode: '' })}
            options={regionOptions}
            className="w-full text-sm"
          />
        </div>

        {/* Tuman: flex 0 1 200px, min 160px */}
        <div className="w-full aa-desktop:w-auto aa-desktop:flex-[0_1_200px] aa-desktop:min-w-[160px]">
          <label htmlFor="company-district-select" className="sr-only">
            Tuman yoki shahar
          </label>
          <Select
            id="company-district-select"
            value={districtCode}
            onChange={(val) => onGeoChange?.({ regionCode, districtCode: val })}
            options={districtOptions}
            disabled={!regionCode}
            className="w-full text-sm"
          />
        </div>

        {/* Tozalash tugmasi */}
        <Button
          variant="ghost"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={onReset}
          className="w-full aa-desktop:w-auto shrink-0"
        >
          Tozalash
        </Button>
      </div>
    </div>
  );
}
