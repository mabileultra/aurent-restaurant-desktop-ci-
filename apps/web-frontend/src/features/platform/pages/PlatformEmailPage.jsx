import React from 'react';
import { PageLayout } from '../../../components/ui';
import PlatformEmailHeader from '../components/email/PlatformEmailHeader';
import PlatformEmailHistoryTab from '../components/email/PlatformEmailHistoryTab';
import PlatformEmailSendTab from '../components/email/PlatformEmailSendTab';
import PlatformEmailSettingsTab from '../components/email/PlatformEmailSettingsTab';
import PlatformEmailTabsNav from '../components/email/PlatformEmailTabsNav';
import PlatformEmailTemplatesTab from '../components/email/PlatformEmailTemplatesTab';
import { usePlatformEmailPage } from '../hooks/usePlatformEmailPage';
import { EMAIL_TAB_KEYS } from '../utils/emailConstants';
import '../../../styles/platform/email.css';

export default function PlatformEmailPage() {
  const page = usePlatformEmailPage();

  return (
    <PageLayout className="platform-email-page space-y-5" spacing="space-y-5">
      <PlatformEmailHeader
        activeTab={page.activeTab}
        onGoToSend={page.handleGoToSend}
        onGoToSettings={page.handleGoToSettings}
      />

      <PlatformEmailTabsNav
        activeTab={page.activeTab}
        onSelectTab={page.setActiveTab}
      />

      <div className="pt-1">
        {page.activeTab === EMAIL_TAB_KEYS.SEND && (
          <PlatformEmailSendTab flow={page.sendFlow} />
        )}
        {page.activeTab === EMAIL_TAB_KEYS.HISTORY && (
          <PlatformEmailHistoryTab
            flow={page.historyFlow}
            onGoToSend={page.handleGoToSend}
          />
        )}
        {page.activeTab === EMAIL_TAB_KEYS.TEMPLATES && (
          <PlatformEmailTemplatesTab flow={page.templatesFlow} />
        )}
        {page.activeTab === EMAIL_TAB_KEYS.SETTINGS && (
          <PlatformEmailSettingsTab flow={page.settingsFlow} />
        )}
      </div>
    </PageLayout>
  );
}
