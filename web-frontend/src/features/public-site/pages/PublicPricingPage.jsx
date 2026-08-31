import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicLeadForm from '../components/PublicLeadForm';

export default function PublicPricingPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <section className="public-static-page__hero">
        <p className="public-static-page__eyebrow">{t('publicSite.pricing.eyebrow')}</p>
        <h1 className="public-static-page__title">{t('publicSite.pricing.title')}</h1>
        <p className="public-static-page__lead">{t('publicSite.pricing.subtitle')}</p>
      </section>
      <section className="public-static-page__content">
        <div className="public-static-page__cards public-static-page__cards--pricing">
          {['start', 'business', 'enterprise'].map((plan) => (
            <article key={plan} className="public-static-page__card public-static-page__card--pricing">
              <h2>{t(`publicSite.pricing.plans.${plan}.name`)}</h2>
              <p className="public-static-page__price">{t(`publicSite.pricing.plans.${plan}.price`)}</p>
              <p>{t(`publicSite.pricing.plans.${plan}.desc`)}</p>
            </article>
          ))}
        </div>
        <div className="public-static-page__panel">
          <h2 className="public-static-page__panel-title">{t('publicSite.pricing.formTitle')}</h2>
          <PublicLeadForm leadType="CONNECT" source="pricing" compact />
        </div>
        <div className="public-static-page__actions">
          <Link to="/contacts" className="public-static-page__ghost">{t('publicSite.pricing.ctaContacts')}</Link>
        </div>
      </section>
    </PublicSitePageShell>
  );
}
