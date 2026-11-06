import PlatformCompactFilterBar from '../../../platform/components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../../../platform/utils/businessTypeFilterOptions';
import GeoFilterSelects from '../../../shared/geo/GeoFilterSelects';
import StoresCompanyFilter from './StoresCompanyFilter';

export default function StoresFiltersBar({
  t,
  search,
  onSearchChange,
  showCompanySelect,
  companies,
  companyId,
  onCompanyChange,
  businessTypes,
  businessType,
  onBusinessTypeChange,
  regionCode,
  districtCode,
  onGeoChange,
}) {
  return (
    <PlatformCompactFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t(
        showCompanySelect ? 'stores.searchPlaceholderPlatform' : 'stores.searchPlaceholder'
      )}
      filterLabel={showCompanySelect ? t('platform.filterBusinessType') : undefined}
      filterOptions={showCompanySelect ? buildBusinessTypeFilterOptions(t, businessTypes) : undefined}
      filterValue={businessType}
      onFilterChange={onBusinessTypeChange}
      onReset={() => {
        onSearchChange('');
        onBusinessTypeChange?.('');
        onCompanyChange?.('');
        onGeoChange?.({ regionCode: '', districtCode: '' });
      }}
      resetLabel={t('common.reset', { defaultValue: 'Сбросить' })}
      extra={(
        <>
          <GeoFilterSelects
            regionCode={regionCode}
            districtCode={districtCode}
            onChange={onGeoChange}
          />
          {showCompanySelect ? (
            <StoresCompanyFilter
              t={t}
              companies={companies}
              companyId={companyId}
              onChange={onCompanyChange}
            />
          ) : null}
        </>
      )}
    />
  );
}
