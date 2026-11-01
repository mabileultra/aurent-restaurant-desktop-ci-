import React from 'react';
import { Check, Info } from 'lucide-react';

export default function PlatformDesktopLivePreviewChecklist({ p }) {
  const { t } = p;
  const isSelect = p.targetScope === 'SELECT';

  let targetSummary;
  if (isSelect) {
    const isCompanies = p.targetType === 'COMPANIES';
    const count = isCompanies ? p.selectedCompanyIds?.length || 0 : p.selectedStoreIds?.length || 0;
    targetSummary = isCompanies
      ? t('platform.desktopNotifications.selectedCompaniesCount', {
          count,
          defaultValue: `${count} ta kompaniya tanlandi`,
        })
      : t('platform.desktopNotifications.selectedStoresCount', {
          count,
          defaultValue: `${count} ta filial tanlandi`,
        });
  } else {
    const totalCount = p.activeRegistersCount ?? p.totalRegistersCount;
    targetSummary = totalCount != null
      ? t('platform.desktopNotifications.preSendCountCheck', { count: totalCount })
      : t('platform.desktopNotifications.sendBtnAll', { defaultValue: 'Barcha kassalarga yuborish' });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5 text-xs">
      <h4 className="font-bold text-slate-900 dark:text-white">
        {t('platform.desktopNotifications.preSendTitle')}
      </h4>

      <div className="space-y-2 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
        <div className="flex items-start gap-2">
          <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>{targetSummary}</span>
        </div>

        <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
          <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <span>
            {p.kind === 'ALERT' && t('platform.desktopNotifications.preSendAlertNote')}
            {p.kind === 'UPDATE' && t('platform.desktopNotifications.preSendUpdateNote')}
            {p.kind === 'MESSAGE' && t('platform.desktopNotifications.preSendMessageNote')}
          </span>
        </div>

        {p.scheduleType === 'SCHEDULED' && p.scheduledFormatted ? (
          <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
            <Check size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{p.scheduledFormatted} da avtomatik yuboriladi</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
