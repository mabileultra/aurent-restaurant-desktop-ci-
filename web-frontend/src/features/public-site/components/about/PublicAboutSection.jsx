import { useTranslation } from 'react-i18next';
import PublicSectionTitle from '../shared/PublicSectionTitle';
import PublicHashLink from '../shared/PublicHashLink';
import { PUBLIC_ABOUT_MEDIA } from '../../constants/publicSiteMedia';
import { PUBLIC_SITE_SECTIONS } from '../../constants/publicSiteSections';
import PublicLazyImage from '../shared/PublicLazyImage';

export default function PublicAboutSection() {
  const { t } = useTranslation();

  return (
    <section className="public-section public-section--alt" id={PUBLIC_SITE_SECTIONS.about}>
      <div className="public-site-section public-about-section">
        <PublicSectionTitle
          eyebrowKey="publicSite.about.eyebrow"
          titleKey="publicSite.about.title"
          leadKey="publicSite.about.subtitle"
        />
        <div className="public-about-section__grid">
          <div className="public-about-cards">
            {[1, 2, 3].map((n) => (
              <article key={n} className="public-about-card">
                <h3>{t(`publicSite.about.block${n}Title`)}</h3>
                <p>{t(`publicSite.about.block${n}Text`)}</p>
              </article>
            ))}
          </div>
          <div className="public-about-section__visual">
            <PublicLazyImage
              src={PUBLIC_ABOUT_MEDIA.image}
              srcSet={PUBLIC_ABOUT_MEDIA.srcSet}
              alt={PUBLIC_ABOUT_MEDIA.alt}
              sizes="(max-width: 900px) 100vw, 40vw"
            />
            <span className="public-about-section__badge">{t('publicSite.about.badge')}</span>
          </div>
        </div>
        <div className="public-page-actions">
          <PublicHashLink to="#contacts" className="public-btn public-btn--primary">
            {t('publicSite.about.cta')}
          </PublicHashLink>
        </div>
      </div>
    </section>
  );
}
