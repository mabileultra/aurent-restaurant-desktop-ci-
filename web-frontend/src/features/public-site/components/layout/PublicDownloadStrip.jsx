import { Link } from 'react-router-dom';
import { Monitor, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PublicDownloadStrip() {
  const { t } = useTranslation();

  return (
    <section className="public-download-strip">
      <div className="public-download-strip__bar">
        <span className="public-download-strip__label">{t('publicSite.downloadStrip.label')}</span>
        <Link to="/install" className="public-download-strip__item">
          <Monitor size={18} aria-hidden />
          Windows
        </Link>
        <Link to="/install" className="public-download-strip__item">
          <Apple size={18} aria-hidden />
          macOS
        </Link>
        <Link to="/install" className="public-download-strip__item">
          {t('publicSite.downloadStrip.more')}
        </Link>
      </div>
      <p className="public-download-strip__support">{t('publicSite.downloadStrip.support')}</p>
    </section>
  );
}
