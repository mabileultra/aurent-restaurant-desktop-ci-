import React from 'react';
import { PageLayout } from '../../../components/ui';
import PlatformDesktopBroadcastForm from '../components/desktop-notifications/PlatformDesktopBroadcastForm';
import PlatformDesktopLivePreview from '../components/desktop-notifications/PlatformDesktopLivePreview';
import PlatformDesktopNotificationsHistory from '../components/desktop-notifications/PlatformDesktopNotificationsHistory';
import PlatformDesktopNotificationDetailDrawer from '../components/desktop-notifications/PlatformDesktopNotificationDetailDrawer';
import PlatformDesktopConfirmModal from '../components/desktop-notifications/PlatformDesktopConfirmModal';
import { usePlatformDesktopNotificationsPage } from '../hooks/usePlatformDesktopNotificationsPage';
import '../../../styles/platform/desktop-notifications.css';

export default function PlatformDesktopNotificationsPage() {
  const p = usePlatformDesktopNotificationsPage();

  return (
    <PageLayout
      className="platform-desktop-notifications-page"
      spacing="space-y-6"
      title={p.t('platform.desktopNotifications.title')}
      subtitle={p.t('platform.desktopNotifications.subtitle')}
    >
      {/* Top 2-Column Grid: Form on Left, Live Cashier Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <PlatformDesktopBroadcastForm p={p} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <PlatformDesktopLivePreview p={p} />
        </div>
      </div>

      {/* Bottom Full-Width Table: Sent Notifications History */}
      <PlatformDesktopNotificationsHistory p={p} />

      {/* Slide-over Detail Drawer when a history row is clicked */}
      <PlatformDesktopNotificationDetailDrawer p={p} />

      {/* Confirmation Modal before broadcasting */}
      <PlatformDesktopConfirmModal p={p} />
    </PageLayout>
  );
}
