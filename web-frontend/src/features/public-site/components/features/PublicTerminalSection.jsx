import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PUBLIC_TERMINAL_MEDIA } from '../../constants/publicSiteMedia';

export default function PublicTerminalSection() {
  const { t } = useTranslation();

  return (
    <section className="public-section" id="features">
      <div className="public-site-section public-terminal">
        <div>
          <p className="public-terminal__label">{t('publicSite.terminal.label')}</p>
          <h2 className="public-terminal__title">{t('publicSite.terminal.title')}</h2>
          <p className="public-terminal__text">{t('publicSite.terminal.text')}</p>
          <Link to="/contacts" className="public-btn public-btn--primary">
            {t('publicSite.terminal.cta')}
          </Link>
        </div>
        <div className="public-terminal__visual">
          <div className="public-terminal__glow" aria-hidden />
          <img
            className="public-terminal__img"
            src={PUBLIC_TERMINAL_MEDIA.image}
            alt={PUBLIC_TERMINAL_MEDIA.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
