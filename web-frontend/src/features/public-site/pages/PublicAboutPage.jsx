import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicSectionTitle from '../components/shared/PublicSectionTitle';

export default function PublicAboutPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <div className="public-page-hero">
        <PublicSectionTitle
          eyebrowKey="publicSite.about.eyebrow"
          titleKey="publicSite.about.title"
          leadKey="publicSite.about.subtitle"
        />
      </div>
      <div className="public-page-content">
        <div className="public-about-cards">
          {[1, 2, 3].map((n) => (
            <article key={n} className="public-about-card">
              <h2>{t(`publicSite.about.block${n}Title`)}</h2>
              <p>{t(`publicSite.about.block${n}Text`)}</p>
            </article>
          ))}
        </div>
        <div className="public-page-actions">
          <Link to="/contacts" className="public-btn public-btn--primary">
            {t('publicSite.about.cta')}
          </Link>
        </div>
      </div>
    </PublicSitePageShell>
  );
}
