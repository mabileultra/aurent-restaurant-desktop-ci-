import React from 'react';
import { Clock } from 'lucide-react';

export default function PlatformLeadsHeaderAlert({ unansweredCount = 0, t }) {
  if (!unansweredCount || unansweredCount <= 0) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-2.5 text-xs font-medium text-amber-900 shadow-2xs dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Clock size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <span>
        {t?.('platform.leads.unansweredAlert', {
          count: unansweredCount,
          defaultValue: `${unansweredCount} ta yangi ariza 1 kundan ortiq javobsiz turibdi. Eng uzoq kutayotganlari ro'yxatning tepasida.`,
        })}
      </span>
    </div>
  );
}
