import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PUBLIC_AUDIENCE_ITEMS } from '../../constants/publicSiteMedia';
import PublicSectionTitle from '../shared/PublicSectionTitle';

export default function PublicAudienceSection() {
  const { t } = useTranslation();

  return (
    <section className="public-section public-section--alt" id="audience">
      <div className="public-site-section">
        <PublicSectionTitle
          eyebrowKey="publicSite.audience.eyebrow"
          titleKey="publicSite.audience.title"
          leadKey="publicSite.audience.subtitle"
        />
        <div className="public-audience-grid">
          {PUBLIC_AUDIENCE_ITEMS.map(({ id, image }) => (
            <Link key={id} to="/about" className="public-audience-card">
              <img
                className="public-audience-card__img"
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="public-audience-card__overlay">
                <h3 className="public-audience-card__title">
                  {t(`publicSite.audience.items.${id}.title`)}
                </h3>
                <span className="public-audience-card__more">
                  {t('publicSite.audience.more')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
