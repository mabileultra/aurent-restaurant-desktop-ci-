import { AlertCircle, CheckCircle2, HardDrive, Inbox, Save } from 'lucide-react';

function OpsCard({ children, warn = false }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        warn
          ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50'
      }`}
    >
      {children}
    </div>
  );
}

export default function PlatformMonitoringOpsStrip({ t, overview }) {
  const ops = overview?.ops;
  if (!ops) return null;

  const hasFailed = ops.financeOutboxFailed > 0;
  const hasPending = ops.financeOutboxPending > 0;
  const diskWarn = ops.diskUsedPercent != null && ops.diskUsedPercent >= (ops.diskWarnPercent ?? 85);
  const backupWarn =
    ops.backupDirConfigured &&
    (ops.lastBackupAgeHours == null || ops.lastBackupAgeHours > 26);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <OpsCard warn={hasFailed}>
        <Inbox className={hasFailed ? 'text-red-500' : 'text-slate-400'} size={20} />
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.financeOutboxFailed')}</p>
          <p className={`text-lg font-semibold ${hasFailed ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
            {ops.financeOutboxFailed}
          </p>
        </div>
      </OpsCard>

      <OpsCard>
        <Inbox className={hasPending ? 'text-amber-500' : 'text-slate-400'} size={20} />
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.financeOutboxPending')}</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{ops.financeOutboxPending}</p>
        </div>
      </OpsCard>

      <OpsCard warn={diskWarn}>
        <HardDrive className={diskWarn ? 'text-amber-500' : 'text-slate-400'} size={20} />
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.diskUsage')}</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ops.diskUsedPercent != null
              ? `${ops.diskUsedPercent}%`
              : t('platform.monitoring.diskUnavailable')}
          </p>
        </div>
      </OpsCard>

      <OpsCard warn={backupWarn}>
        <Save className={backupWarn ? 'text-amber-500' : 'text-slate-400'} size={20} />
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{t('platform.monitoring.lastBackup')}</p>
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {!ops.backupDirConfigured
              ? t('platform.monitoring.backupNotMounted')
              : ops.lastBackupAgeHours != null
                ? t('platform.monitoring.backupAgeHours', { hours: ops.lastBackupAgeHours })
                : t('platform.monitoring.backupMissing')}
          </p>
          {ops.lastBackupFileName ? (
            <p className="truncate text-xs text-slate-500">{ops.lastBackupFileName}</p>
          ) : null}
        </div>
      </OpsCard>

      <OpsCard>
        {ops.sentryEnabled ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <AlertCircle className="text-slate-400" size={20} />
        )}
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.sentryBackend')}</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ops.sentryEnabled ? t('platform.monitoring.sentryOn') : t('platform.monitoring.sentryOff')}
          </p>
        </div>
      </OpsCard>

      <OpsCard>
        {ops.identitySentryEnabled ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <AlertCircle className="text-slate-400" size={20} />
        )}
        <div>
          <p className="text-xs text-slate-500">{t('platform.monitoring.sentryIdentity')}</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ops.identitySentryEnabled
              ? t('platform.monitoring.sentryOn')
              : t('platform.monitoring.sentryOff')}
          </p>
        </div>
      </OpsCard>
    </div>
  );
}
