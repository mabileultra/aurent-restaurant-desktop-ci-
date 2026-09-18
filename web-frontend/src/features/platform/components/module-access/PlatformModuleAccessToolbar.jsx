import PlatformCompactFilterBar from '../PlatformCompactFilterBar';
import PlatformModuleAccessCompanySelect from './PlatformModuleAccessCompanySelect';
import { buildBusinessTypeFilterOptions } from '../../utils/businessTypeFilterOptions';

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
      filterLabel={t('platform.filterBusinessType')}
      filterOptions={buildBusinessTypeFilterOptions(t, businessTypes)}
      filterValue={businessType}
      onFilterChange={onBusinessTypeChange}
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
