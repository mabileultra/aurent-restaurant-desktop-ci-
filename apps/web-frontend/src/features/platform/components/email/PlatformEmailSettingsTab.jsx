import React from 'react';
import PlatformEmailSecuritySettings from './PlatformEmailSecuritySettings';
import PlatformEmailSenderSettings from './PlatformEmailSenderSettings';

export default function PlatformEmailSettingsTab({ flow }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        <PlatformEmailSenderSettings flow={flow} />
        <PlatformEmailSecuritySettings flow={flow} />
      </div>

      {flow.dirty && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-10">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            O‘zgarishlar saqlanmagan
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={flow.handleCancel}
              className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={flow.handleSave}
              className="h-10 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
