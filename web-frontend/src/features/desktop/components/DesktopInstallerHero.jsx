import { Apple, CheckCircle2, Loader, Monitor } from 'lucide-react';
import InstallerDownloadButton from './InstallerDownloadButton';
import { formatInstallerBytes } from '../utils/installerFormatUtils';

export default function DesktopInstallerHero({ t, manifest, version, releasedAt, isLoading, isError }) {
  return (
    <section className="installer-hero">
      <div className="installer-hero__inner">
        <span className="installer-hero__badge">
          <CheckCircle2 size={14} aria-hidden />
          {version
            ? t('installer.versionBadge', { version })
            : t('installer.versionBadgeFallback')}
        </span>

        <h1 className="installer-hero__title">
          <span className="installer-hero__title-kassa">{t('installer.heroTitleKassa')} </span>
          <span className="installer-hero__title-brand">{t('installer.heroTitleBrand')}</span>
        </h1>

        <p className="installer-hero__subtitle">{t('installer.subtitle')}</p>

        <div className="installer-hero__downloads">
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
          <InstallerDownloadButton
            href={manifest?.mac?.url}
            label={t('installer.downloadForMac')}
            sublabel={
              manifest?.mac?.size
                ? formatInstallerBytes(manifest.mac.size)
                : t('installer.notAvailable')
            }
            icon={Apple}
            disabled={!manifest?.mac?.url}
          />
        </div>

        <div className="installer-hero__meta">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader size={15} className="animate-spin" />
              {t('installer.loadingVersion')}
            </span>
          ) : version ? (
            <span>{t('installer.versionLine', { version, date: releasedAt })}</span>
          ) : isError ? (
            <span className="installer-hero__meta--warn">{t('installer.manifestUnavailable')}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
