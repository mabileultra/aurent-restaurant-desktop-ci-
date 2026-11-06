import React from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';

export default function PlatformEmailSecuritySettings({ flow }) {
  const {
    watchEmails,
    newEmail,
    setNewEmail,
    addWatchEmail,
    removeWatchEmail,
    settings,
    toggleTrigger,
  } = flow;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 px-5 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Nazorat manzillari</h2>
          <p className="text-xs text-slate-500">Super-admin paneliga kirilganda shu manzillarga xabar ketadi</p>
        </div>

        <ul className="divide-y divide-slate-100 p-2 px-5 text-xs dark:divide-slate-800">
          {watchEmails.map((w) => (
            <li key={w.email} className="flex items-center gap-3 py-3">
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  w.verified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                <Mail className="h-4 w-4" />
              </span>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white">{w.email}</span>
                <span
                  className={`text-[11px] font-medium ${
                    w.verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {w.verified ? 'Tasdiqlangan' : 'Tasdiqlash kutilmoqda'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeWatchEmail(w.email)}
                aria-label={`${w.email} manzilini o‘chirish`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2.5 p-4 px-5 border-t border-slate-100 dark:border-slate-800">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="ism@kompaniya.uz"
            className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={addWatchEmail}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-100 px-4 text-xs font-semibold text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
          >
            <Plus className="h-4 w-4" />
            Qo‘shish
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 px-5 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Xavfsizlik ogohlantirishlari</h2>
          <p className="text-xs text-slate-500">Nazorat manzillariga qachon xat yuborilsin</p>
        </div>

        <div className="divide-y divide-slate-100 px-5 text-xs dark:divide-slate-800">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">Har bir super-admin kirishida</span>
              <span className="text-slate-500 text-[11px]">Hozirgi xatti-harakat</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.triggers.everyLogin}
              onClick={() => toggleTrigger('everyLogin')}
              className={`flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition ${
                settings.triggers.everyLogin ? 'bg-emerald-700 justify-end' : 'bg-slate-300 justify-start dark:bg-slate-700'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">
                Yangi qurilma yoki IP manzildan kirilganda
              </span>
              <span className="text-slate-500 text-[11px]">Xatda “Yangi qurilma” belgisi chiqadi</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.triggers.newDevice}
              onClick={() => toggleTrigger('newDevice')}
              className={`flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition ${
                settings.triggers.newDevice ? 'bg-emerald-700 justify-end' : 'bg-slate-300 justify-start dark:bg-slate-700'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">
                Ketma-ket noto‘g‘ri parol kiritilganda
              </span>
              <span className="text-slate-500 text-[11px]">Super-admin hisobiga 5 marta muvaffaqiyatsiz urinish</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.triggers.failedAttempts}
              onClick={() => toggleTrigger('failedAttempts')}
              className={`flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition ${
                settings.triggers.failedAttempts ? 'bg-emerald-700 justify-end' : 'bg-slate-300 justify-start dark:bg-slate-700'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
