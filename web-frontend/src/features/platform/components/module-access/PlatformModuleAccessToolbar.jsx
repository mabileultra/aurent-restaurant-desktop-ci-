import { PageSearchField } from '../../../../components/ui';
import PlatformModuleAccessCompanySelect from './PlatformModuleAccessCompanySelect';
import '../../../../styles/platform/module-access-toolbar.css';

export default function PlatformModuleAccessToolbar({
  t,
  userSearch,
  onUserSearchChange,
  companies,
  companyId,
  onCompanyChange,
}) {
  return (
    <div className="module-access-toolbar">
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
  );
}
