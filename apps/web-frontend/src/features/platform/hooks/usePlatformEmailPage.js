import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMAIL_TAB_KEYS } from '../utils/emailConstants';
import { useEmailHistoryFlow } from './useEmailHistoryFlow';
import { useEmailSendFlow } from './useEmailSendFlow';
import { useEmailSettingsFlow } from './useEmailSettingsFlow';
import { useEmailTemplatesFlow } from './useEmailTemplatesFlow';

export function usePlatformEmailPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(EMAIL_TAB_KEYS.SEND);

  const sendFlow = useEmailSendFlow();
  const historyFlow = useEmailHistoryFlow();
  const templatesFlow = useEmailTemplatesFlow();
  const settingsFlow = useEmailSettingsFlow();

  const handleGoToSend = () => {
    setActiveTab(EMAIL_TAB_KEYS.SEND);
  };

  const handleGoToSettings = () => {
    setActiveTab(EMAIL_TAB_KEYS.SETTINGS);
  };

  return {
    t,
    activeTab,
    setActiveTab,
    handleGoToSend,
    handleGoToSettings,
    sendFlow,
    historyFlow,
    templatesFlow,
    settingsFlow,
  };
}
