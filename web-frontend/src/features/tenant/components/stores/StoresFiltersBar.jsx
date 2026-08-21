import { PageSearchField } from '../../../../components/ui';
import BusinessTypeFilterChips from '../../../platform/components/BusinessTypeFilterChips';
import StoresCompanyFilter from './StoresCompanyFilter';
import '../../../../styles/tenant/stores-filters.css';

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
    <div className="stores-filters">
      <div className="stores-filters__row">
        <PageSearchField
          className="stores-filters__search"
          value={search}
          onChange={onSearchChange}
          placeholder={t(
            showCompanySelect ? 'stores.searchPlaceholderPlatform' : 'stores.searchPlaceholder'
          )}
        />
        {showCompanySelect ? (
          <StoresCompanyFilter
            t={t}
            companies={companies}
            companyId={companyId}
            onChange={onCompanyChange}
          />
        ) : null}
      </div>
      {showCompanySelect ? (
        <BusinessTypeFilterChips
          types={businessTypes}
          value={businessType}
          onChange={onBusinessTypeChange}
        />
      ) : null}
    </div>
  );
}
