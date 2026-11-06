import { Loader, Monitor } from 'lucide-react';
import InstallerDownloadButton from './InstallerDownloadButton';
import { formatInstallerBytes } from '../utils/installerFormatUtils';

export default function DesktopProductCard({
  t,
  title,
  brand,
  description,
  accent = 'green',
  manifest,
  version,
  releasedAt,
  isLoading,
  isError,
  unavailableText,
}) {
  return (
    <article className={`installer-product installer-product--${accent}`}>
      <header className="installer-product__head">
        <h2 className="installer-product__title">
          <span className="installer-product__title-name">{title} </span>
          <span className="installer-product__title-brand">{brand}</span>
        </h2>
        <p className="installer-product__desc">{description}</p>
      </header>

      <div className="installer-product__downloads">
        <InstallerDownloadButton
          href={manifest?.windows?.url}
          label={t('installer.downloadForWindows')}
          sublabel={
            manifest?.windows?.size
              ? formatInstallerBytes(manifest.windows.size)
              : t('installer.notAvailable')
          }
          icon={Monitor}
          disabled={!manifest?.windows?.url}
        />
      </div>

      <div className="installer-product__meta">
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size={14} className="animate-spin" />
            {t('installer.loadingVersion')}
          </span>
        ) : version ? (
          <span>{t('installer.versionLine', { version, date: releasedAt })}</span>
        ) : isError || !manifest ? (
          <span className={unavailableText ? undefined : 'installer-hero__meta--warn'}>
            {unavailableText || t('installer.manifestUnavailable')}
          </span>
        ) : null}
      </div>
    </article>
  );
}
