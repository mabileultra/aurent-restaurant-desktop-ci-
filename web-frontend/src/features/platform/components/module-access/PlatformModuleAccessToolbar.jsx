import BusinessTypeFilterChips from '../BusinessTypeFilterChips';
import PlatformCompactFilterBar from '../PlatformCompactFilterBar';
import PlatformModuleAccessCompanySelect from './PlatformModuleAccessCompanySelect';

export default function PlatformModuleAccessToolbar({
  t,
  userSearch,
  onUserSearchChange,
  companies,
  companyId,
  onCompanyChange,
  businessTypes,
  businessType,
  onBusinessTypeChange,
}) {
  return (
    <PlatformCompactFilterBar
      search={userSearch}
      onSearchChange={onUserSearchChange}
      searchPlaceholder={t('platform.moduleAccess.userSearch')}
      filters={(
        <BusinessTypeFilterChips
          types={businessTypes}
          value={businessType}
          onChange={onBusinessTypeChange}
        />
      )}
      extra={(
        <PlatformModuleAccessCompanySelect
          t={t}
          companies={companies}
          companyId={companyId}
          onChange={onCompanyChange}
        />
      )}
    />
  );
}
