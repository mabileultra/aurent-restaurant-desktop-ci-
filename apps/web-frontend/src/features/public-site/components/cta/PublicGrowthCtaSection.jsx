import { useTranslation } from 'react-i18next';
import PublicHashLink from '../shared/PublicHashLink';

export default function PublicGrowthCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="public-growth-cta" id="growth">
      <div className="public-site-section public-growth-cta__inner">
        <h2 className="public-growth-cta__title">{t('publicSite.growthCta.title')}</h2>
        <p className="public-growth-cta__text">{t('publicSite.growthCta.text')}</p>
        <div className="public-growth-cta__actions">
          <PublicHashLink to="#pricing" className="public-btn public-btn--ghost-light">
            {t('publicSite.growthCta.ctaTerms')}
          </PublicHashLink>
          <PublicHashLink to="#contacts" className="public-btn public-btn--white">
            {t('publicSite.growthCta.ctaDemo')}
          </PublicHashLink>
        </div>
      </div>
    </section>
  );
}
