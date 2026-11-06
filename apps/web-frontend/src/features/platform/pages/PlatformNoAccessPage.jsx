import { PageLayout } from '../../../components/ui';
import { useTranslation } from 'react-i18next';
import '../../../styles/platform/no-access.css';

export default function PlatformNoAccessPage() {
  const { t } = useTranslation();
  return (
    <PageLayout
      className="platform-no-access"
      title={t('platform.noAccess.title')}
      subtitle={t('platform.noAccess.subtitle')}
    />
  );
}
