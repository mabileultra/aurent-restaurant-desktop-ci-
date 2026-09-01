import { Link } from 'react-router-dom';
import { Monitor, Apple, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PublicDownloadStrip({ embedded = false }) {
  const { t } = useTranslation();

  const bar = (
    <div className="public-download-strip__bar">
      <span className="public-download-strip__label">{t('publicSite.downloadStrip.label')}</span>
      <Link to="/install" className="public-download-strip__item">
        <Smartphone size={18} aria-hidden />
        Android
      </Link>
      <Link to="/install" className="public-download-strip__item">
        <Apple size={18} aria-hidden />
        iOS
      </Link>
      <Link to="/install" className="public-download-strip__item">
        <Monitor size={18} aria-hidden />
        Windows
      </Link>
      <Link to="/install" className="public-download-strip__item">
        {t('publicSite.downloadStrip.more')}
      </Link>
    </div>
  );

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
