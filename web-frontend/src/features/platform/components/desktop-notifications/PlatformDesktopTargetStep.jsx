import React from 'react';
import { Monitor } from 'lucide-react';
import PlatformDesktopTargetSelectedArea from './PlatformDesktopTargetSelectedArea';

export default function PlatformDesktopTargetStep({ p }) {
  const { t } = p;
  const isSelect = p.targetScope === 'SELECT';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          1
        </span>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.stepTarget')}
        </h3>
      </div>

      {/* Scope Switcher Tabs */}
      <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => p.setTargetScope('ALL')}
          aria-pressed={!isSelect}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            !isSelect
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('platform.desktopNotifications.targetAll')}
        </button>

        <button
          type="button"
          onClick={() => p.setTargetScope('SELECT')}
          aria-pressed={isSelect}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            isSelect
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('platform.desktopNotifications.targetSelect')}
        </button>
      </div>

      {!isSelect ? (
        /* ALL registers info card */
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
            <Monitor size={17} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {p.activeCount != null
                ? `${t('platform.desktopNotifications.registersCount', { count: p.activeCount })}${
                    p.onlineRegistersCount != null && p.onlineRegistersCount > 0
                      ? ` · ${t('platform.desktopNotifications.onlineCount', { defaultValue: `Hozir onlayn: ${p.onlineRegistersCount}` })}`
                      : ''
                  }`
                : t('platform.desktopNotifications.registersCountUnknown', { defaultValue: 'Noma‘lum (barcha faol kassalar)' })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.allCompaniesOfflineNote')}
            </p>
          </div>
        </div>
      ) : (
        /* Targeted Selection Area (Extracted subcomponent) */
        <PlatformDesktopTargetSelectedArea p={p} />
      )}
    </div>
  );
}
