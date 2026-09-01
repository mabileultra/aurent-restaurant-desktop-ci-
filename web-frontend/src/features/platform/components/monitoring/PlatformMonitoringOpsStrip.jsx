import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export default function PlatformMonitoringOpsStrip({ t, overview }) {
  const ops = overview?.ops;
  if (!ops) return null;

  const hasFailed = ops.financeOutboxFailed > 0;
  const hasPending = ops.financeOutboxPending > 0;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          hasFailed
            ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50'
        }`}
      >
        <Inbox className={hasFailed ? 'text-red-500' : 'text-slate-400'} size={20} />
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.financeOutboxFailed')}</p>
          <p className={`text-lg font-semibold ${hasFailed ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
            {ops.financeOutboxFailed}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <Inbox className={hasPending ? 'text-amber-500' : 'text-slate-400'} size={20} />
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.financeOutboxPending')}</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{ops.financeOutboxPending}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        {ops.sentryEnabled ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <AlertCircle className="text-slate-400" size={20} />
        )}
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.sentryStatus')}</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ops.sentryEnabled
              ? t('platform.monitoring.sentryOn')
              : t('platform.monitoring.sentryOff')}
          </p>
        </div>
      </div>
    </div>
  );
}
