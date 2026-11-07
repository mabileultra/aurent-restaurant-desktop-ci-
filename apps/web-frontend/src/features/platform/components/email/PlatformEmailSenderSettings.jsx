import React from 'react';
import { CheckCircle2, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailSenderSettings({ flow }) {
  const { t } = useTranslation();
  const { settings } = flow;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 px-5 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Yuboruvchi</h2>
          <p className="text-xs text-slate-500">Qabul qiluvchi xatda ko‘radigan nom va manzil</p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Yuboruvchi nomi
            </label>
            <input
              id="sender-name"
              type="text"
              readOnly
              value={settings.sender.name}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Yuboruvchi manzili
            </label>
            <input
              id="sender-email"
              type="email"
              readOnly
              value={settings.sender.email}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-reply-to" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Javob uchun manzil
            </label>
            <input
              id="sender-reply-to"
              type="email"
              readOnly
              value={settings.sender.replyTo}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-lang" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Xatlar tili
            </label>
            <input
              id="sender-lang"
              type="text"
              readOnly
              value="Qabul qiluvchi tilida"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 px-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Pochta serveri (SMTP)</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Xatlar shu server orqali jo‘natiladi</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            {t('platform.email.settings.statusActive', 'Faol')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-6">
          <div className="flex flex-col gap-1.5 sm:col-span-4">
            <label htmlFor="smtp-server" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Server</label>
            <input
              id="smtp-server"
              type="text"
              readOnly
              value={settings.smtp.server}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 font-mono px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="smtp-port" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Port</label>
            <input
              id="smtp-port"
              type="text"
              readOnly
              value={settings.smtp.port}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label htmlFor="smtp-login" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Login</label>
            <input
              id="smtp-login"
              type="text"
              readOnly
              value={settings.smtp.login}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label htmlFor="smtp-pass" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Parol</label>
            <input
              id="smtp-pass"
              type="password"
              readOnly
              value="••••••••••••"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5 text-xs dark:border-slate-800">
          <span className="text-slate-500">Parol shifrlangan holda saqlanadi</span>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-xs font-semibold text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
          >
            <RotateCw className="h-3.5 w-3.5" />
            {t('platform.email.settings.testConnComingSoon', 'Ulanishni tekshirish tez kunda')}
          </button>
        </div>
      </section>
    </div>
  );
}
