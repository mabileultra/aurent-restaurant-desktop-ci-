import React from 'react';
import PlatformDesktopDurationPicker from './PlatformDesktopDurationPicker';
import PlatformDesktopTimeSchedulePicker from './PlatformDesktopTimeSchedulePicker';

export default function PlatformDesktopScheduleStep({ p }) {
  const { t } = p;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          4
        </span>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.stepSchedule')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <PlatformDesktopDurationPicker p={p} />
        <PlatformDesktopTimeSchedulePicker p={p} />
      </div>
    </div>
  );
}
