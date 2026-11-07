import React from 'react';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PlatformEmailAudienceSelector from './PlatformEmailAudienceSelector';
import PlatformEmailConfirmModal from './PlatformEmailConfirmModal';

export default function PlatformEmailComposeForm({ flow }) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {t('platform.email.newEmail', 'Yangi xabar')}
        </h2>
        <span
          className={`text-xs font-medium transition-colors ${
            flow.draftStatus === 'saving'
              ? 'text-amber-600 dark:text-amber-400'
              : flow.draftStatus === 'error'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {flow.draftStatus === 'saving'
            ? t('platform.email.draftSaving', 'Qoralama saqlanmoqda...')
            : flow.draftStatus === 'error'
            ? t('platform.email.draftError', 'Qoralama saqlanmadi')
            : t('platform.email.draftSaved', 'Qoralama saqlandi')}
        </span>
      </div>

      <PlatformEmailAudienceSelector flow={flow} />

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            2
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('platform.email.stepMessage', 'Xabar')}
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label htmlFor="email-subject">{t('platform.email.subject', 'Mavzu')}</label>
            <span className="text-slate-500">{flow.subjectLength} / 120</span>
          </div>
          <input
            id="email-subject"
            type="text"
            value={flow.subject}
            onChange={(e) => flow.setSubject(e.target.value)}
            placeholder={t('platform.email.subjectPlaceholder', 'Aurent POS dan muhim xabar')}
            maxLength={120}
            aria-invalid={Boolean(flow.errors?.subject)}
            aria-describedby={flow.errors?.subject ? 'email-subject-error' : undefined}
            className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
              flow.errors?.subject
                ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/20'
                : 'border-slate-300 focus:border-emerald-600 dark:border-slate-700'
            }`}
          />
          {flow.errors?.subject && (
            <span id="email-subject-error" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {flow.errors.subject}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-message" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('platform.email.message', 'Matn')}
          </label>
          <div
            className={`rounded-xl border overflow-hidden transition dark:border-slate-700 ${
              flow.errors?.message
                ? 'border-rose-500 ring-1 ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('platform.email.addVariable', 'Qo‘shish:')}
              </span>
              <button
                type="button"
                onClick={() => flow.insertVariable('{{recipientName}}')}
                title={t('platform.email.variableRecipientName', 'Qabul qiluvchi ismini qo‘shish')}
                className="h-6 rounded border border-dashed border-emerald-400 bg-emerald-50 px-2.5 font-mono text-xs text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                &#123;&#123;recipientName&#125;&#125;
              </button>
            </div>
            <textarea
              id="email-message"
              rows={7}
              value={flow.message}
              onChange={(e) => flow.setMessage(e.target.value)}
              placeholder={t('platform.email.messagePlaceholder', 'Foydalanuvchilar uchun matn kiriting…')}
              aria-invalid={Boolean(flow.errors?.message)}
              aria-describedby={flow.errors?.message ? 'email-message-error' : undefined}
              className="w-full resize-y p-3 text-sm leading-relaxed outline-none dark:bg-slate-900 dark:text-white"
            />
          </div>
          {flow.errors?.message && (
            <span id="email-message-error" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {flow.errors.message}
            </span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('platform.email.variableDesc', 'Belgilangan o‘zgaruvchilar har bir qabul qiluvchi uchun alohida to‘ldiriladi.')}
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="relative group">
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
        </div>
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

      <PlatformEmailConfirmModal
        isOpen={flow.isConfirmOpen}
        onClose={flow.closeConfirm}
        onConfirm={flow.handleConfirmSend}
        recipientCount={flow.recipientCount}
        audienceLabel={flow.audienceLabel}
        subject={flow.subject}
        isSending={flow.isSending}
      />
    </section>
  );
}
