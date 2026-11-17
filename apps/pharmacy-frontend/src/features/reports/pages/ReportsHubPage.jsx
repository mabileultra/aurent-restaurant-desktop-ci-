import { PageHeader } from '../../../components/ui';
import ReportsHubSection from '../components/ReportsHubSection';
import { useReportsHubPage } from '../hooks/useReportsHubPage';

export default function ReportsHubPage() {
  const { t, salesLinks, stockLinks } = useReportsHubPage();

  return (
    <div className="space-y-8">
      <PageHeader title={t('reportsHub.title')} subtitle={t('reportsHub.subtitle')} />

      <ReportsHubSection
        title={t('reportsHub.salesSection')}
        subtitle={t('reportsHub.salesSectionHint')}
        links={salesLinks}
        t={t}
      />

      <ReportsHubSection
        title={t('reportsHub.stockSection')}
        subtitle={t('reportsHub.stockSectionHint')}
        links={stockLinks}
        t={t}
      />
    </div>
  );
}
