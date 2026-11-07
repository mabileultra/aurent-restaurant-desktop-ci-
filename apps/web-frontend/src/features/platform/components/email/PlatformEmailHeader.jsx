import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EMAIL_TAB_KEYS } from '../../utils/emailConstants';

export default function PlatformEmailHeader({ activeTab, onGoToSend }) {
  const { t } = useTranslation();
  const isHistory = activeTab === EMAIL_TAB_KEYS.HISTORY;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('platform.email.nav', 'Pochta')}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t('platform.email.nav', 'Pochta')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('platform.email.subtitle', 'Foydalanuvchilarga xabar yuborish, avtomatik xatlar va yetkazilish nazorati')}
        </p>
      </div>

      {isHistory && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToSend}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            {t('platform.email.newEmail', 'Yangi xabar')}
          </button>
        </div>
      )}
    </div>
  );
}
