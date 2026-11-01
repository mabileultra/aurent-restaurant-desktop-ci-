import { Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../../../components/ui';
import PlatformModuleAccessToolbar from '../components/module-access/PlatformModuleAccessToolbar';
import PlatformModuleAccessWorkspace from '../components/module-access/PlatformModuleAccessWorkspace';
import { usePlatformModuleAccessPage } from '../hooks/usePlatformModuleAccessPage';
import '../../../styles/platform/module-access.css';

export default function PlatformModuleAccessPage() {
  const p = usePlatformModuleAccessPage();

  return (
    <PageLayout
      className="mx-auto max-w-6xl"
      spacing="space-y-4"
      title={(
        <span className="flex items-center gap-2">
          <Shield className="text-emerald-500" size={24} />
          {p.t('platform.moduleAccess.title')}
        </span>
      )}
      subtitle={p.t('platform.moduleAccess.subtitle')}
      actions={(
        <Link
          to="/platform/access-v2"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900"
        >
          <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>Yangi kartali ko'rinish (V2)</span>
          <ArrowRight size={14} />
        </Link>
      )}
      filters={(
        <PlatformModuleAccessToolbar
          t={p.t}
          userSearch={p.userSearch}
          onUserSearchChange={p.setUserSearch}
          companies={p.companies}
          companyId={p.companyId}
          onCompanyChange={p.handleCompanyChange}
          businessTypes={p.businessTypes}
          businessType={p.businessType}
          onBusinessTypeChange={p.handleBusinessTypeChange}
          includePlatformStaff={p.includePlatformStaff}
        />
      )}
    >
      <PlatformModuleAccessWorkspace p={p} />
    </PageLayout>
  );
}
