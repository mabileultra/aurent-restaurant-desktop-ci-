import { PageSearchField } from '../../../../components/ui';
import BusinessTypeFilterChips from '../BusinessTypeFilterChips';
import PlatformModuleAccessCompanySelect from './PlatformModuleAccessCompanySelect';
import '../../../../styles/platform/module-access-toolbar.css';

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
    <div className="module-access-toolbar module-access-toolbar--stacked">
      <div className="module-access-toolbar__row">
        <PageSearchField
          className="module-access-toolbar__search"
          value={userSearch}
          onChange={onUserSearchChange}
          placeholder={t('platform.moduleAccess.userSearch')}
        />
        <PlatformModuleAccessCompanySelect
          t={t}
          companies={companies}
          companyId={companyId}
          onChange={onCompanyChange}
        />
      </div>
      <BusinessTypeFilterChips
        types={businessTypes}
        value={businessType}
        onChange={onBusinessTypeChange}
      />
    </div>
  );
}
