import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PlatformEmailSecuritySettings from './PlatformEmailSecuritySettings';
import PlatformEmailSenderSettings from './PlatformEmailSenderSettings';

export default function PlatformEmailSettingsTab({ flow }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <span>
          {t('platform.email.settings.viewOnlyNotice', 'Pochta serveri sozlamalari hozirda faqat ko‘rish rejimida. Server sozlamalarini o‘zgartirish tez kunda ishga tushadi.')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        <PlatformEmailSenderSettings flow={flow} />
        <PlatformEmailSecuritySettings flow={flow} />
      </div>
    </div>
  );
}
