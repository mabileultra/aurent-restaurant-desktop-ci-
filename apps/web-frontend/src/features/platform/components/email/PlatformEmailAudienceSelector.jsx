import React from 'react';
import { Check, Search, Users, X } from 'lucide-react';

export default function PlatformEmailAudienceSelector({ flow }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
          1
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Kimga yuboriladi</h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {flow.modes.map((m) => {
          const isSelected = flow.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => flow.setMode(m.id)}
              className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left transition ${
                isSelected
                  ? 'border-2 border-emerald-700 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/30'
                  : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {flow.mode === 'all' && (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Email manzili bor barcha faol foydalanuvchilarga yuboriladi. Super-admin hisoblari kiritilmaydi.
        </p>
      )}

      {flow.mode === 'role' && (
        <div className="flex flex-wrap gap-2">
          {flow.roleOptions.map((r) => {
            const isOn = !!flow.roles[r.id];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => flow.toggleRole(r.id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
                  isOn
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isOn && <Check className="h-3.5 w-3.5" />}
                {r.label}
                <span className="opacity-80 font-normal">({r.count})</span>
              </button>
            );
          })}
        </div>
      )}

      {flow.mode === 'company' && (
        <div className="flex flex-wrap gap-2">
          {flow.companies.map((c) => (
            <span
              key={c.id}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              {c.name} · {c.count}
              <button
                type="button"
                onClick={() => flow.removeCompany(c.id)}
                aria-label="Olib tashlash"
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-emerald-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {flow.mode === 'manual' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={flow.userSearch}
                onChange={(e) => flow.setUserSearch(e.target.value)}
                placeholder="Ism, login yoki email..."
                className="h-9 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={flow.allUsersChecked}
                onChange={(e) => flow.toggleAllUsers(e.target.checked)}
                className="rounded text-emerald-700"
              />
              Hammasini tanlash
            </label>
          </div>
          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800">
            {flow.manualUsers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={u.checked}
                  onChange={() => flow.toggleUserCheck(u.id)}
                  className="rounded text-emerald-700"
                />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {u.ini}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {u.email} · {u.role} · {u.company}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-xs dark:bg-emerald-950/20 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          <span className="text-slate-800 dark:text-slate-200">
            <b>{flow.countLabel}</b> — har biriga alohida xat ketadi, boshqalarning manzili ko‘rinmaydi
          </span>
        </div>
      </div>
    </div>
  );
}
