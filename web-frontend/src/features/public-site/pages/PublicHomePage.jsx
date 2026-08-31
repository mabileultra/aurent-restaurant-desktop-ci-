import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PublicSitePageShell from '../components/PublicSitePageShell';

export default function PublicHomePage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <section className="public-static-page__hero public-static-page__hero--center">
        <p className="public-static-page__eyebrow">{t('publicSite.homePage.eyebrow')}</p>
        <h1 className="public-static-page__title">{t('publicSite.homePage.title')}</h1>
        <p className="public-static-page__lead">{t('publicSite.homePage.subtitle')}</p>
        <div className="public-static-page__actions">
          <Link to="/contacts" className="public-static-page__cta">{t('publicSite.homePage.ctaDemo')}</Link>
          <Link to="/install" className="public-static-page__ghost">{t('publicSite.homePage.ctaInstall')}</Link>
        </div>
      </section>
    </PublicSitePageShell>
  );
}
