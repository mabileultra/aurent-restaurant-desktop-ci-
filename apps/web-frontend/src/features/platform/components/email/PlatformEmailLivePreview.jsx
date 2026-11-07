import React from 'react';
import { Loader2, Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailLivePreview({ flow }) {
  const { t } = useTranslation();
  const isDesktop = flow.device === 'desktop';
  const sample = flow.currentSample;
  const recipientName = sample?.name || 'Foydalanuvchi';
  const recipientEmail = sample?.email || 'user@aurent.uz';

  const processedMessage = (flow.message || '').replace(/\{\{recipientName\}\}/g, recipientName);

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('platform.email.previewCardTitle', 'Ko‘rinish')}
          </h2>
          {flow.isPreviewLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => flow.setDevice('desktop')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              isDesktop
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            {t('platform.email.deviceDesktop', 'Kompyuter')}
          </button>
          <button
            type="button"
            onClick={() => flow.setDevice('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              !isDesktop
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            {t('platform.email.deviceMobile', 'Telefon')}
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-[70px_minmax(0,1fr)] gap-y-1.5 border-b border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
        <dt className="text-slate-500">{t('platform.email.from', 'Kimdan')}</dt>
        <dd className="font-medium text-slate-900 dark:text-slate-200">Aurent POS &lt;noreply@aurent.uz&gt;</dd>
        <dt className="text-slate-500">{t('platform.email.to', 'Kimga')}</dt>
        <dd className="font-medium text-slate-900 dark:text-slate-200">{recipientName} &lt;{recipientEmail}&gt;</dd>
        <dt className="text-slate-500">{t('platform.email.subject', 'Mavzu')}</dt>
        <dd className="font-bold text-slate-900 dark:text-white">
          {flow.subject.trim() || t('platform.email.noSubject', 'Mavzu kiritilmagan')}
        </dd>
      </dl>

      <div className="flex flex-1 items-start justify-center bg-slate-50/70 p-5 dark:bg-slate-950/40 min-h-[420px]">
        {flow.previewHtml ? (
          <div
            className={`w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/80 transition-all dark:border-slate-800 ${
              isDesktop ? 'max-w-[560px]' : 'max-w-[340px]'
            }`}
          >
            <iframe
              title="Email Preview"
              srcDoc={flow.previewHtml}
              className="w-full h-[440px] border-none bg-white rounded-2xl"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div
            className={`w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/80 transition-all dark:bg-slate-900 dark:border-slate-800 ${
              isDesktop ? 'max-w-[560px]' : 'max-w-[340px]'
            }`}
          >
            <div className="flex items-center gap-2.5 bg-emerald-700 px-5 py-4 text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                A
              </span>
              <span className="text-base font-bold tracking-tight">Aurent POS</span>
            </div>

            <div className="flex flex-col gap-3 p-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {flow.subject.trim() || t('platform.email.noSubject', 'Mavzu kiritilmagan')}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Assalomu alaykum, <b>{recipientName}</b>!
              </p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {processedMessage.trim() || t('platform.email.emptyMessagePreview', 'Xabar matni shu yerda ko‘rinadi.')}
              </p>
              <div className="pt-2">
                <span className="inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm">
                  Tizimga kirish
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800">
              © 2026 Aurent POS · Bu avtomatik xabar, unga javob yozish shart emas.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
        <span className="text-slate-600 dark:text-slate-300 truncate font-medium">
          {t('platform.email.sampleLabel', 'Namuna:')} {recipientName} &lt;{recipientEmail}&gt;
        </span>
      </div>
    </section>
  );
}
