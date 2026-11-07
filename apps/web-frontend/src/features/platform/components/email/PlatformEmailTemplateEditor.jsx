import React from 'react';
import { Info, Mail, Save, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailTemplateEditor({ flow }) {
  const { t } = useTranslation();
  const { currentTemplate, currentLangContent, lang, setLang } = flow;

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 px-5 dark:border-slate-800">
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {currentTemplate.title}
          </h2>
          <span className="font-mono text-xs text-slate-500">{currentTemplate.code}</span>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setLang('uz')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              lang === 'uz'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            O‘zbekcha
          </button>
          <button
            type="button"
            onClick={() => setLang('ru')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              lang === 'ru'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Русский
          </button>
        </div>
      </div>

      <div className="m-4 mb-0 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <span>
          {t('platform.email.autoTemplates.viewOnlyNotice', 'Shablonlar faqat ko‘rish rejimida. Tahrirlash va saqlash funksiyasi tez kunda ishga tushadi.')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] items-stretch">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.email.subject', 'Mavzu')}
            </label>
            <input
              type="text"
              readOnly
              value={currentLangContent?.subject || ''}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.email.message', 'Matn')}
            </label>
            <textarea
              rows={9}
              readOnly
              value={currentLangContent?.body || ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm leading-relaxed text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tugma</span>
            <div className="flex gap-2.5">
              <input
                type="text"
                readOnly
                value={currentLangContent?.button || ''}
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
              />
              <input
                type="text"
                readOnly
                value="{{loginUrl}}"
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-800/40"
              />
            </div>
          </div>

          {currentTemplate.secure && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
              <span>
                Parol faqat shu xatda bir marta yuboriladi. Tarix bo‘limida u yashirilgan holda saqlanadi.
              </span>
            </div>
          )}
        </div>

        <aside className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40 md:border-t-0 md:border-l">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">O‘zgaruvchilar</h3>
          <span className="text-[11px] text-slate-500 block mb-3">
            Shablonda ishlatiladigan parametrlar
          </span>
          <div className="flex flex-col gap-2">
            {(currentTemplate.vars || []).map((v) => (
              <div
                key={v.key}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-800 dark:bg-slate-800"
              >
                <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  {v.key}
                </span>
                <span className="text-[11px] text-slate-500">{v.desc}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 p-4 px-5 dark:border-slate-800">
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
        >
          <Mail className="h-4 w-4" />
          {t('platform.email.testEmailSelf', 'O‘zimga test xat')}
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            {t('platform.email.comingSoon', 'Tez kunda')}
          </span>
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-200 px-5 text-xs font-semibold text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
        >
          <Save className="h-4 w-4" />
          {t('platform.email.autoTemplates.saveComingSoon', 'Saqlash tez kunda')}
        </button>
      </div>
    </section>
  );
}
