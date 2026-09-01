import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PUBLIC_HERO_MEDIA } from '../../constants/publicSiteMedia';

export default function PublicHeroSection() {
  const { t } = useTranslation();

  return (
    <section className="public-hero" id="top">
      <div className="public-hero__content">
        <p className="public-hero__eyebrow">{t('publicSite.homePage.eyebrow')}</p>
        <h1 className="public-hero__title">
          {t('publicSite.homePage.titleBefore')}
          {' '}
          <span className="public-hero__title-accent">{t('publicSite.homePage.titleAccent')}</span>
        </h1>
        <p className="public-hero__lead">{t('publicSite.homePage.subtitle')}</p>
        <div className="public-hero__actions">
          <Link to="/contacts" className="public-btn public-btn--primary">
            {t('publicSite.homePage.ctaDemo')}
          </Link>
          <Link to="/install" className="public-btn public-btn--ghost">
            {t('publicSite.homePage.ctaInstall')}
          </Link>
        </div>
        <p className="public-hero__note">{t('publicSite.homePage.heroNote')}</p>
      </div>
      <div className="public-hero__visual">
        <div className="public-hero__glow" aria-hidden />
        <img
          className="public-hero__device"
          src={PUBLIC_HERO_MEDIA.device}
          alt={PUBLIC_HERO_MEDIA.alt}
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
}
