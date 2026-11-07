import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailHistoryKPIs({ stats }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {t('platform.email.history.kpiTotal', 'Yuborilgan xatlar')}
        </span>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {stats.totalSent}
        </span>
        <span className="text-xs text-slate-500">
          {stats.hasData
            ? `${stats.bulkCount} ta ommaviy · ${stats.autoCount} ta avtomatik`
            : 'Yozuvlar yo‘q'}
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {t('platform.email.history.kpiDelivered', 'Yetkazildi')}
        </span>
        <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
          {stats.deliveryRate}
        </span>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: stats.hasData ? stats.deliveryRate : '0%' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {t('platform.email.history.kpiFailed', 'Xato bilan')}
        </span>
        <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
          {stats.totalFail}
        </span>
        <span className="text-xs text-slate-500">
          {stats.totalFail === '0' || !stats.totalFail
            ? 'Qayta yuboriladigan xato yo‘q'
            : `${stats.totalFail} ta xatolik`}
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {t('platform.email.history.kpiQueued', 'Navbatda')}
        </span>
        <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
          {stats.totalQueued}
        </span>
        <span className="text-xs text-slate-500">
          {stats.totalQueued === '0' || !stats.totalQueued
            ? 'Navbat bo‘sh'
            : `${stats.totalQueued} ta navbatda`}
        </span>
      </div>
    </div>
  );
}
