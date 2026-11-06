import React from 'react';
import { Bold, Italic, Link2, List, Mail, Send } from 'lucide-react';
import PlatformEmailAudienceSelector from './PlatformEmailAudienceSelector';

export default function PlatformEmailComposeForm({ flow }) {
  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Yangi xabar</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Qoralama avtomatik saqlandi</span>
      </div>

      <PlatformEmailAudienceSelector flow={flow} />

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            2
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Xabar</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label htmlFor="email-subject">Mavzu</label>
            <span className="text-slate-500">{flow.subjectLength} / 120</span>
          </div>
          <input
            id="email-subject"
            type="text"
            value={flow.subject}
            onChange={(e) => flow.setSubject(e.target.value)}
            maxLength={120}
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-message" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Matn
          </label>
          <div className="rounded-xl border border-slate-300 overflow-hidden dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 p-1.5 dark:border-slate-800 dark:bg-slate-800">
              <button type="button" className="h-7 w-7 rounded font-extrabold text-slate-700 hover:bg-slate-200 dark:text-slate-300">B</button>
              <button type="button" className="h-7 w-7 rounded italic font-serif text-slate-700 hover:bg-slate-200 dark:text-slate-300">I</button>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-200 dark:text-slate-300">
                <Link2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-200 dark:text-slate-300">
                <List className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-700" />
              <span className="text-xs text-slate-500">Qo‘shish:</span>
              <button
                type="button"
                onClick={() => flow.insertVariable('{{ism}}')}
                className="h-6 rounded border border-dashed border-emerald-400 bg-emerald-50 px-2 font-mono text-[11px] text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                &#123;&#123;ism&#125;&#125;
              </button>
              <button
                type="button"
                onClick={() => flow.insertVariable('{{korxona}}')}
                className="h-6 rounded border border-dashed border-emerald-400 bg-emerald-50 px-2 font-mono text-[11px] text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                &#123;&#123;korxona&#125;&#125;
              </button>
            </div>
            <textarea
              id="email-message"
              rows={6}
              value={flow.message}
              onChange={(e) => flow.setMessage(e.target.value)}
              className="w-full resize-y p-3 text-sm leading-relaxed outline-none dark:bg-slate-900 dark:text-white"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            Belgilangan o‘zgaruvchilar har bir qabul qiluvchi uchun alohida to‘ldiriladi.
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
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
          onClick={flow.handleSend}
          disabled={flow.isSending || flow.recipientCount === 0}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {flow.sendLabel}
        </button>
      </div>
    </section>
  );
}
