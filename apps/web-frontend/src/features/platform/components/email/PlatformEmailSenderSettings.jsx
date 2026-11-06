import React from 'react';
import { CheckCircle2, RotateCw } from 'lucide-react';

export default function PlatformEmailSenderSettings({ flow }) {
  const { settings, updateSender, updateSmtp, handleTestConnection } = flow;

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
              value={settings.sender.name}
              onChange={(e) => updateSender('name', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Yuboruvchi manzili
            </label>
            <input
              id="sender-email"
              type="email"
              value={settings.sender.email}
              onChange={(e) => updateSender('email', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-reply-to" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Javob uchun manzil
            </label>
            <input
              id="sender-reply-to"
              type="email"
              value={settings.sender.replyTo}
              onChange={(e) => updateSender('replyTo', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sender-lang" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Xatlar tili
            </label>
            <select
              id="sender-lang"
              value={settings.sender.lang}
              onChange={(e) => updateSender('lang', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
            >
              <option value="recipient">Qabul qiluvchi tilida</option>
              <option value="uz">Doim o‘zbekcha</option>
              <option value="ru">Doim ruscha</option>
            </select>
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
            {settings.smtp.status}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-6">
          <div className="flex flex-col gap-1.5 sm:col-span-4">
            <label htmlFor="smtp-server" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Server</label>
            <input
              id="smtp-server"
              type="text"
              value={settings.smtp.server}
              onChange={(e) => updateSmtp('server', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 font-mono px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="smtp-port" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Port</label>
            <input
              id="smtp-port"
              type="text"
              value={settings.smtp.port}
              onChange={(e) => updateSmtp('port', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label htmlFor="smtp-login" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Login</label>
            <input
              id="smtp-login"
              type="text"
              value={settings.smtp.login}
              onChange={(e) => updateSmtp('login', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label htmlFor="smtp-pass" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Parol</label>
            <input
              id="smtp-pass"
              type="password"
              value={settings.smtp.pass}
              onChange={(e) => updateSmtp('pass', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-6">
            <label htmlFor="smtp-encryption" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shifrlash</label>
            <select
              id="smtp-encryption"
              value={settings.smtp.encryption}
              onChange={(e) => updateSmtp('encryption', e.target.value)}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
            >
              <option value="STARTTLS">STARTTLS</option>
              <option value="SSL/TLS">SSL / TLS</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5 text-xs dark:border-slate-800">
          <span className="text-slate-500">Parol shifrlangan holda saqlanadi va qayta ko‘rsatilmaydi</span>
          <button
            type="button"
            onClick={handleTestConnection}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Ulanishni tekshirish
          </button>
        </div>
      </section>
    </div>
  );
}
