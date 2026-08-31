import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PublicSitePageShell from '../components/PublicSitePageShell';

export default function PublicAboutPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <section className="public-static-page__hero">
        <p className="public-static-page__eyebrow">{t('publicSite.about.eyebrow')}</p>
        <h1 className="public-static-page__title">{t('publicSite.about.title')}</h1>
        <p className="public-static-page__lead">{t('publicSite.about.subtitle')}</p>
      </section>
      <section className="public-static-page__content">
        <div className="public-static-page__cards">
          {[1, 2, 3].map((n) => (
            <article key={n} className="public-static-page__card">
              <h2>{t(`publicSite.about.block${n}Title`)}</h2>
              <p>{t(`publicSite.about.block${n}Text`)}</p>
            </article>
          ))}
        </div>
        <div className="public-static-page__actions">
          <Link to="/contacts" className="public-static-page__cta">{t('publicSite.about.cta')}</Link>
        </div>
      </section>
    </PublicSitePageShell>
  );
}
