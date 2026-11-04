import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCw } from 'lucide-react';
import { fetchPharmacyInstallerManifest } from '../utils/installerManifestApi';
import { formatInstallerBytes } from '../utils/installerFormatUtils';
import { usePharmacyDesktopAutoMigrate } from '../hooks/usePharmacyDesktopAutoMigrate';
import '../../../styles/desktop/pharmacy-force-update.css';

/**
 * Жёсткий блок на старом grocery-desktop для PHARMACY.
 * Desktop: авто-скачивание pharmacy installer → silent install → запуск нового → выход.
 * Browser fallback: ручная ссылка на установщик.
 */
export default function PharmacyDesktopForceUpdateModal({ open }) {
  const { t } = useTranslation();
  const { data: manifest, isLoading, isError } = useQuery({
    queryKey: ['pharmacy-desktop-force-manifest'],
    queryFn: fetchPharmacyInstallerManifest,
    enabled: open,
    staleTime: 60_000,
    retry: 2,
  });

  const migrate = usePharmacyDesktopAutoMigrate({ open, manifest });

  if (!open) return null;

  const size = manifest?.windows?.size
    ? formatInstallerBytes(manifest.windows.size)
    : null;
  const version = manifest?.version;
  const statusText = (() => {
    if (!migrate.autoEnabled) return null;
    if (migrate.phase === 'downloading') {
      return migrate.percent != null
        ? t('pharmacyForceUpdate.autoDownloading', { percent: migrate.percent })
        : t('pharmacyForceUpdate.autoDownloadingIndeterminate');
    }
    if (migrate.phase === 'installing') return t('pharmacyForceUpdate.autoInstalling');
    if (migrate.phase === 'launching') return t('pharmacyForceUpdate.autoLaunching');
    if (migrate.phase === 'error') {
      return t(`pharmacyForceUpdate.autoError.${migrate.errorCode}`, {
        defaultValue: t('pharmacyForceUpdate.autoError.generic'),
      });
    }
    return t('pharmacyForceUpdate.autoStarting');
  })();

  return (
    <div
      className="pharm-force-update"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pharm-force-update-title"
      aria-describedby="pharm-force-update-body"
    >
      <div className="pharm-force-update__card">
        <p className="pharm-force-update__badge">{t('pharmacyForceUpdate.badge')}</p>
        <h1 id="pharm-force-update-title" className="pharm-force-update__title">
          {t('pharmacyForceUpdate.title')}
        </h1>
        <p id="pharm-force-update-body" className="pharm-force-update__body">
          {migrate.autoEnabled
            ? t('pharmacyForceUpdate.autoBody')
            : t('pharmacyForceUpdate.body')}
        </p>
        {version ? (
          <p className="pharm-force-update__meta">
            {t('pharmacyForceUpdate.version', { version })}
            {size ? ` · ${size}` : ''}
          </p>
        ) : null}
        {statusText ? <p className="pharm-force-update__status">{statusText}</p> : null}
        {migrate.phase === 'downloading' && migrate.percent != null ? (
          <div
            className="pharm-force-update__bar"
            role="progressbar"
            aria-valuenow={migrate.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${migrate.percent}%` }} />
          </div>
        ) : null}
        {isError ? (
          <p className="pharm-force-update__warn">{t('pharmacyForceUpdate.manifestError')}</p>
        ) : null}

        {migrate.autoEnabled && migrate.phase === 'error' ? (
          <button type="button" className="pharm-force-update__cta" onClick={migrate.retry}>
            <RefreshCw size={20} strokeWidth={2.4} aria-hidden />
            <span>{t('pharmacyForceUpdate.retryAuto')}</span>
          </button>
        ) : null}

        <a
          className="pharm-force-update__cta pharm-force-update__cta--secondary"
          href={migrate.manualHref}
          download={Boolean(manifest?.windows?.url)}
        >
          <Download size={20} strokeWidth={2.4} aria-hidden />
          <span>
            {isLoading
              ? t('pharmacyForceUpdate.loading')
              : t('pharmacyForceUpdate.download')}
          </span>
        </a>
        <p className="pharm-force-update__hint">
          {migrate.autoEnabled
            ? t('pharmacyForceUpdate.autoHint')
            : t('pharmacyForceUpdate.hint')}
        </p>
      </div>
    </div>
  );
}
