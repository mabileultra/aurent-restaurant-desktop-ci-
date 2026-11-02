import React from 'react';

export default function PlatformLeadAdminSection({
  leadName,
  branchName,
  onBranchNameChange,
  createAdmin,
  onCreateAdminChange,
  adminName,
  onAdminNameChange,
  adminLogin,
  onAdminLoginChange,
  markDone,
  onMarkDoneChange,
}) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        Birinchi filial va admin
      </h4>
      <div>
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
          Filial nomi
        </label>
        <input
          type="text"
          value={branchName}
          onChange={(e) => onBranchNameChange(e.target.value)}
          className="w-full sm:max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={createAdmin}
            onChange={(e) => onCreateAdminChange(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Ariza egasini admin qilib yaratish</span>
        </label>
        <p className="text-[11px] text-slate-500 pl-5">
          {leadName} kompaniyaning birinchi administratori bo'ladi.
        </p>
        {createAdmin && (
          <div className="grid grid-cols-1 gap-2 pt-1 pl-5 sm:grid-cols-2">
            <input
              type="text"
              value={adminName}
              onChange={(e) => onAdminNameChange(e.target.value)}
              placeholder="Ism"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              type="text"
              value={adminLogin}
              onChange={(e) => onAdminLoginChange(e.target.value)}
              placeholder="Login"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={markDone}
            onChange={(e) => onMarkDoneChange(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Arizani yakunlash</span>
        </label>
        <p className="text-[11px] text-slate-500 pl-5">
          Holat «Yakunlangan» bo'ladi va ariza kompaniyaga bog'lanadi. Tarixda yoziladi.
        </p>
      </div>
    </div>
  );
}
