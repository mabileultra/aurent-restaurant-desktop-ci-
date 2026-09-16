import BusinessTypeFilterChips from '../../../platform/components/BusinessTypeFilterChips';
import PlatformCompactFilterBar from '../../../platform/components/PlatformCompactFilterBar';
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
}) {
  return (
    <PlatformCompactFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t(
        showCompanySelect ? 'stores.searchPlaceholderPlatform' : 'stores.searchPlaceholder'
      )}
      filters={showCompanySelect ? (
        <BusinessTypeFilterChips
          types={businessTypes}
          value={businessType}
          onChange={onBusinessTypeChange}
        />
      ) : null}
      extra={showCompanySelect ? (
        <StoresCompanyFilter
          t={t}
          companies={companies}
          companyId={companyId}
          onChange={onCompanyChange}
        />
      ) : null}
    />
  );
}
