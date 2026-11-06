import { Monitor, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRestaurantDesktopManifest } from '../hooks/useRestaurantDesktopManifest';
import '../../../styles/desktop-download/restaurant-desktop-download-corner.css';

function CornerDownloadLink({ href, available, label, title, icon: Icon }) {
  const className = available && href
    ? 'rst-dl-corner__btn'
    : 'rst-dl-corner__btn rst-dl-corner__btn--disabled';

  if (!available || !href) {
    return (
      <span className={className} title={title} aria-label={label} aria-disabled="true">
        <Icon size={18} aria-hidden />
      </span>
    );
  }

  return (
    <a className={className} href={href} download title={title} aria-label={label}>
      <Icon size={18} aria-hidden />
    </a>
  );
}

/** Compact corner downloads — Windows + macOS icons only. */
export default function RestaurantDesktopDownloadCorner() {
  const { t } = useTranslation();
  const { version, windows, mac } = useRestaurantDesktopManifest();

  const versionHint = version ? ` v${version}` : '';

  return (
    <div className="rst-dl-corner" role="group" aria-label={t('rst.desktopDownload.aria')}>
      <CornerDownloadLink
        href={windows.url}
        available={windows.available}
        label={t('rst.desktopDownload.windows')}
        title={`${t('rst.desktopDownload.windows')}${versionHint}`}
        icon={Monitor}
      />
      <CornerDownloadLink
        href={mac.url}
        available={mac.available}
        label={t('rst.desktopDownload.mac')}
        title={`${t('rst.desktopDownload.mac')}${versionHint}`}
        icon={Apple}
      />
    </div>
  );
}
