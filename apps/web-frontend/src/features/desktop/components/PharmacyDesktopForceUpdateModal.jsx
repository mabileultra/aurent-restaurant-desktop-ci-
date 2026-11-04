import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { fetchPharmacyInstallerManifest } from '../utils/installerManifestApi';
import { formatInstallerBytes } from '../utils/installerFormatUtils';
import '../../../styles/desktop/pharmacy-force-update.css';

/**
 * Жёсткий блок на старом grocery-desktop для PHARMACY:
 * модалку нельзя закрыть — только скачать новый Aurent Pharmacy.
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

  if (!open) return null;

  const href = manifest?.windows?.url || '/downloads/pharmacy-desktop/';
  const size = manifest?.windows?.size
    ? formatInstallerBytes(manifest.windows.size)
    : null;
  const version = manifest?.version;

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
          {t('pharmacyForceUpdate.body')}
        </p>
        {version ? (
          <p className="pharm-force-update__meta">
            {t('pharmacyForceUpdate.version', { version })}
            {size ? ` · ${size}` : ''}
          </p>
        ) : null}
        {isError ? (
          <p className="pharm-force-update__warn">{t('pharmacyForceUpdate.manifestError')}</p>
        ) : null}
        <a
          className="pharm-force-update__cta"
          href={href}
          download={Boolean(manifest?.windows?.url)}
        >
          <Download size={20} strokeWidth={2.4} aria-hidden />
          <span>
            {isLoading
              ? t('pharmacyForceUpdate.loading')
              : t('pharmacyForceUpdate.download')}
          </span>
        </a>
        <p className="pharm-force-update__hint">{t('pharmacyForceUpdate.hint')}</p>
      </div>
    </div>
  );
}
