import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicIncludedBand from '../components/pricing/PublicIncludedBand';
import PublicLeadForm from '../components/PublicLeadForm';
import PublicSectionTitle from '../components/shared/PublicSectionTitle';
import { PUBLIC_PRICING_PLANS } from '../constants/publicSiteMedia';

export default function PublicPricingPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <div className="public-page-hero">
        <PublicSectionTitle
          eyebrowKey="publicSite.pricing.eyebrow"
          titleKey="publicSite.pricing.title"
          leadKey="publicSite.pricing.subtitle"
        />
      </div>
      <div className="public-page-content">
        <div className="public-pricing-cards">
          {PUBLIC_PRICING_PLANS.map((plan) => (
            <article key={plan} className="public-pricing-card">
              <h2>{t(`publicSite.pricing.plans.${plan}.name`)}</h2>
              <p className="public-pricing-card__price">{t(`publicSite.pricing.plans.${plan}.price`)}</p>
              <p>{t(`publicSite.pricing.plans.${plan}.desc`)}</p>
            </article>
          ))}
        </div>
        <div className="public-panel">
          <h2 className="public-panel__title">{t('publicSite.pricing.formTitle')}</h2>
          <PublicLeadForm leadType="CONNECT" source="pricing" compact />
        </div>
        <div className="public-page-actions">
          <Link to="/contacts" className="public-btn public-btn--ghost">
            {t('publicSite.pricing.ctaContacts')}
          </Link>
        </div>
      </div>
      <PublicIncludedBand />
    </PublicSitePageShell>
  );
}
