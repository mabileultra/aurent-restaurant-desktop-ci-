import React from 'react';
import { Mail, RotateCcw, Save, ShieldAlert } from 'lucide-react';

export default function PlatformEmailTemplateEditor({ flow }) {
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] items-stretch">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mavzu
            </label>
            <input
              type="text"
              value={currentLangContent.subject}
              onChange={(e) => flow.handleUpdateField('subject', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Matn
            </label>
            <textarea
              rows={11}
              value={currentLangContent.body}
              onChange={(e) => flow.handleUpdateField('body', e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-y"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tugma</span>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={currentLangContent.button}
                onChange={(e) => flow.handleUpdateField('button', e.target.value)}
                placeholder="Tugma matni"
                className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                type="text"
                readOnly
                value="{{loginUrl}}"
                className="h-10 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 font-mono text-xs text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800"
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
            Bosilsa matn oxiriga qo‘shiladi
          </span>
          <div className="flex flex-col gap-2">
            {currentTemplate.vars.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => flow.insertVariable(v.key)}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-emerald-500 hover:bg-emerald-50/40 dark:border-slate-800 dark:bg-slate-800 transition"
              >
                <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  {v.key}
                </span>
                <span className="text-[11px] text-slate-500">{v.desc}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5 dark:border-slate-800">
        <button
          type="button"
          onClick={flow.handleResetToDefault}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Standart matnga qaytarish
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={flow.handleTestEmail}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Mail className="h-4 w-4" />
            O‘zimga test xat
          </button>
          <button
            type="button"
            onClick={flow.handleSave}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Save className="h-4 w-4" />
            Saqlash
          </button>
        </div>
      </div>
    </section>
  );
}
