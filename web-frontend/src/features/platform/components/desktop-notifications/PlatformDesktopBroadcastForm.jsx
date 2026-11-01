import React from 'react';
import { Send } from 'lucide-react';
import PlatformDesktopTargetStep from './PlatformDesktopTargetStep';
import PlatformDesktopContentStep from './PlatformDesktopContentStep';
import PlatformDesktopKindStep from './PlatformDesktopKindStep';
import PlatformDesktopScheduleStep from './PlatformDesktopScheduleStep';
import PlatformDesktopFormFooter from './PlatformDesktopFormFooter';

export default function PlatformDesktopBroadcastForm({ p }) {
  const { t } = p;
  const currentTitle = p.title || '';
  const currentBody = p.body || '';

  const canSend = p.canSend != null
    ? p.canSend
    : Boolean(
        currentTitle.trim() &&
        currentBody.trim() &&
        !p.sendPending &&
        p.isCustomHoursValid !== false &&
        (p.hasValidTarget !== false)
      );

  const activeCount = p.activeRegistersCount ?? p.totalRegistersCount;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-6">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Send size={18} />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.broadcastTitle')}
          </h2>
        </div>

        {/* Draft Indicator or Restored Notice */}
        {p.isDraftRestored ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
            <span className="font-medium">
              {t('platform.desktopNotifications.draftRestoredNotice', { defaultValue: 'Qoralama tiklandi' })}
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={p.handleClear}
              className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
            >
              {t('platform.desktopNotifications.clearBtn', { defaultValue: 'Tozalash' })}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{t('platform.desktopNotifications.draftSaved')}</span>
          </div>
        )}
      </div>

      {/* Step 1: Kimga (Barcha kassalar vs Tanlab yuborish) */}
      <PlatformDesktopTargetStep p={{ ...p, activeCount }} />

      {/* Step 2: Xabar matni */}
      <PlatformDesktopContentStep p={p} />

      {/* Step 3: Turi */}
      <PlatformDesktopKindStep p={p} />

      {/* Step 4: Muddat va vaqt */}
      <PlatformDesktopScheduleStep p={p} />

      {/* Footer controls */}
      <PlatformDesktopFormFooter p={{ ...p, activeCount }} canSend={canSend} />
    </section>
  );
}
