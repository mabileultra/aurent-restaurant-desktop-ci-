import { Link } from 'react-router-dom';
import { Apple, Download, Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PUBLIC_DOWNLOAD_PLATFORMS } from '../../constants/publicSiteDownloads';

function PlatformIcon({ type }) {
  if (type === 'apple') return <Apple size={20} aria-hidden />;
  if (type === 'windows') return <Monitor size={20} aria-hidden />;
  if (type === 'download') return <Download size={20} aria-hidden />;
  return <Smartphone size={20} aria-hidden />;
}

export default function PublicDownloadStrip({ fullBleed = false, embedded = false }) {
  const { t } = useTranslation();

  const bar = (
    <div className="public-download-strip__bar">
      {PUBLIC_DOWNLOAD_PLATFORMS.map(({ id, labelKey, icon }) => (
        <Link key={id} to="/install" className="public-download-strip__item">
          <PlatformIcon type={icon} />
          {t(labelKey)}
        </Link>
      ))}
    </div>
  );

  if (fullBleed) {
    return (
      <div className="public-download-strip public-download-strip--full-bleed" id="download">
        <div className="public-download-strip__inner">{bar}</div>
      </div>
    );
  }

  if (embedded) {
    return <div className="public-download-strip public-download-strip--embedded">{bar}</div>;
  }

  return (
    <section className="public-download-strip" id="download">
      {bar}
      <p className="public-download-strip__support">{t('publicSite.downloadStrip.support')}</p>
    </section>
  );
}
