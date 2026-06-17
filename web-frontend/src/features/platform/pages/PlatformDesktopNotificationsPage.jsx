import { PageLayout } from '../../../components/ui';
import PlatformDesktopBroadcastForm from '../components/desktop-notifications/PlatformDesktopBroadcastForm';
import PlatformDesktopNotificationsHistory from '../components/desktop-notifications/PlatformDesktopNotificationsHistory';
import { usePlatformDesktopNotificationsPage } from '../hooks/usePlatformDesktopNotificationsPage';
import { useTranslation } from 'react-i18next';
import '../../../styles/platform/desktop-notifications.css';

export default function PlatformDesktopNotificationsPage() {
  const { i18n } = useTranslation();
  const p = usePlatformDesktopNotificationsPage();

  return (
    <PageLayout
      className="platform-desktop-notifications-page"
      title={p.t('platform.desktopNotifications.title')}
      subtitle={p.t('platform.desktopNotifications.subtitle')}
    >
      <div className="platform-desktop-notifications-page__grid">
        <PlatformDesktopBroadcastForm
          t={p.t}
          title={p.title}
          onTitleChange={p.setTitle}
          body={p.body}
          onBodyChange={p.setBody}
          kind={p.kind}
          onKindChange={p.setKind}
          expiresInHours={p.expiresInHours}
          onExpiresInHoursChange={p.setExpiresInHours}
          onSend={p.handleSend}
          sendPending={p.sendPending}
        />
        <PlatformDesktopNotificationsHistory
          t={p.t}
          items={p.history}
          loading={p.historyLoading}
          language={i18n.language}
        />
      </div>
    </PageLayout>
  );
}
