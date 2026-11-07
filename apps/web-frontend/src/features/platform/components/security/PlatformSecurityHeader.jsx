import React from 'react';
import { UserPlus, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';

export default function PlatformSecurityHeader({ onOpenCreateStaff, onGoToRules }) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span>{t('platform.security.breadcrumbControl', 'Boshqaruv')}</span>
          <span>›</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
            {t('platform.security.nav', 'Xavfsizlik')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('platform.security.title', 'Xavfsizlik')}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            {t('platform.security.monitoringComingSoon', 'Monitoring: Tez kunda')}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('platform.security.subtitle', 'Kirishlar, xodimlar harakatlari va kirish qoidalari nazorati')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <BaseButton
          variant="secondary"
          className="text-xs sm:text-sm font-semibold gap-1.5"
          onClick={onGoToRules}
        >
          <Lock className="w-4 h-4 text-slate-500" />
          <span>{t('platform.security.tabs.rules', 'Kirish qoidalari')}</span>
        </BaseButton>
        <BaseButton
          className="text-xs sm:text-sm font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
          onClick={onOpenCreateStaff}
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('platform.security.newStaffButton', 'Yangi xodim')}</span>
        </BaseButton>
      </div>
    </header>
  );
}
