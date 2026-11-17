import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/ui';
import AiAssistantWidget from '../components/AiAssistantWidget';
import AiAssistantChartPanel from '../components/AiAssistantChartPanel';
import { useAiAssistantPage } from '../hooks/useAiAssistantPage';

export default function AiAssistantPage() {
  const { t } = useTranslation();
  const { chartData, setChartData } = useAiAssistantPage();

  return (
    <div className="admin-page admin-page--full space-y-4">
      <PageHeader title={t('aiAssistant.pageTitle')} subtitle={t('aiAssistant.pageIntro')} />
      <AiAssistantWidget onChartDataChange={setChartData} />
      <AiAssistantChartPanel data={chartData} />
    </div>
  );
}
