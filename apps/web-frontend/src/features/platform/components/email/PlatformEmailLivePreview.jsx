import React from 'react';
import { ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react';

export default function PlatformEmailLivePreview({ flow }) {
  const isDesktop = flow.device === 'desktop';
  const sample = flow.currentSample;
  const recipientName = sample?.name || 'Dilshod Karimov';
  const recipientEmail = sample?.email || 'd.karimov@dostonkafe.uz';
  const companyName = sample?.company || 'DOSTON KAFE';

  const processedMessage = (flow.message || '')
    .replace(/\{\{ism\}\}/g, recipientName)
    .replace(/\{\{korxona\}\}/g, companyName);

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Ko‘rinish</h2>
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
            Kompyuter
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
            Telefon
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-[70px_minmax(0,1fr)] gap-y-1.5 border-b border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
        <dt className="text-slate-500">Kimdan</dt>
        <dd className="font-medium text-slate-900 dark:text-slate-200">Aurent POS &lt;noreply@aurent.uz&gt;</dd>
        <dt className="text-slate-500">Kimga</dt>
        <dd className="font-medium text-slate-900 dark:text-slate-200">{recipientName} &lt;{recipientEmail}&gt;</dd>
        <dt className="text-slate-500">Mavzu</dt>
        <dd className="font-bold text-slate-900 dark:text-white">{flow.subject.trim() || 'Mavzu kiritilmagan'}</dd>
      </dl>

      <div className="flex flex-1 items-start justify-center bg-slate-50/70 p-5 dark:bg-slate-950/40">
        <div
          className={`w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/80 transition-all dark:bg-slate-900 dark:border-slate-800 ${
            isDesktop ? 'max-w-[560px]' : 'max-w-[320px]'
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
              {flow.subject.trim() || 'Mavzu kiritilmagan'}
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Assalomu alaykum, <b>{recipientName}</b>!
            </p>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {processedMessage.trim() || 'Xabar matni shu yerda ko‘rinadi.'}
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
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
        <span className="text-slate-500 truncate">
          Namuna: {recipientName} · {sample?.role || 'Foydalanuvchi'} · {companyName}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={flow.prevSample}
            aria-label="Oldingi namuna"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={flow.nextSample}
            aria-label="Keyingi namuna"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
