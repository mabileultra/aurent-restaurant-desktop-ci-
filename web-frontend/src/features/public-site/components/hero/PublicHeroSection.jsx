import { useTranslation } from 'react-i18next';
import PublicHashLink from '../shared/PublicHashLink';
import PublicDownloadStrip from '../layout/PublicDownloadStrip';
import PublicHeroDevices from './PublicHeroDevices';
import PublicHeroSupport from './PublicHeroSupport';

export default function PublicHeroSection() {
  const { t } = useTranslation();

  return (
    <section className="public-hero-wrap" id="top">
      <div className="public-hero-wrap__waves" aria-hidden />
      <div className="public-hero-wrap__inner">
        <div className="public-hero">
          <div className="public-hero__content">
            <h1 className="public-hero__title">
              <span className="public-hero__title-line">{t('publicSite.homePage.titleLine1')}</span>
              <span className="public-hero__title-accent-row">
                <span className="public-hero__title-accent">{t('publicSite.homePage.titleAccent')}</span>
                {' '}
                <span className="public-hero__title-line">{t('publicSite.homePage.titleLine2')}</span>
              </span>
            </h1>
            <p className="public-hero__lead">{t('publicSite.homePage.subtitle')}</p>
            <PublicHashLink to="#contacts" className="public-btn public-btn--primary public-btn--hero">
              {t('publicSite.homePage.ctaDemo')}
            </PublicHashLink>
            <p className="public-hero__note">{t('publicSite.homePage.heroNote')}</p>
          </div>
          <PublicHeroDevices />
        </div>
        <div className="public-hero__bottom">
          <PublicHeroSupport />
          <PublicDownloadStrip embedded />
        </div>
      </div>
    </section>
  );
}
