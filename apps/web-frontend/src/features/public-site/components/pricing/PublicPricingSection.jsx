import { useTranslation } from 'react-i18next';
import PublicLeadForm from '../PublicLeadForm';
import PublicSectionTitle from '../shared/PublicSectionTitle';
import PublicHashLink from '../shared/PublicHashLink';
import { PUBLIC_PRICING_PLANS } from '../../constants/publicSiteMedia';

export default function PublicPricingSection() {
  const { t } = useTranslation();

  return (
    <section className="public-section public-pricing-section" id="pricing-plans">
      <div className="public-site-section">
        <PublicSectionTitle
          eyebrowKey="publicSite.pricing.eyebrow"
          titleKey="publicSite.pricing.title"
          leadKey="publicSite.pricing.subtitle"
        />
        <div className="public-pricing-cards">
          {PUBLIC_PRICING_PLANS.map((plan) => (
            <article key={plan} className="public-pricing-card">
              <h3>{t(`publicSite.pricing.plans.${plan}.name`)}</h3>
              <p className="public-pricing-card__price">{t(`publicSite.pricing.plans.${plan}.price`)}</p>
              <p>{t(`publicSite.pricing.plans.${plan}.desc`)}</p>
            </article>
          ))}
        </div>
        <div className="public-panel public-pricing-section__form">
          <h3 className="public-panel__title">{t('publicSite.pricing.formTitle')}</h3>
          <PublicLeadForm leadType="CONNECT" source="pricing" compact />
        </div>
        <div className="public-page-actions">
          <PublicHashLink to="#contacts" className="public-btn public-btn--ghost">
            {t('publicSite.pricing.ctaContacts')}
          </PublicHashLink>
        </div>
      </div>
    </section>
  );
}
