import { useTranslation } from 'react-i18next';
import { PUBLIC_AUDIENCE_ITEMS } from '../../constants/publicSiteMedia';
import PublicHashLink from '../shared/PublicHashLink';

export default function PublicAudienceSection() {
  const { t } = useTranslation();

  return (
    <section className="public-audience" id="audience">
      <div className="public-site-section">
        <div className="public-audience__scroll">
          {PUBLIC_AUDIENCE_ITEMS.map(({ id, image }) => (
            <PublicHashLink key={id} to="#about" className="public-audience-card">
              <div className="public-audience-card__top">
                <h3 className="public-audience-card__title">
                  {t(`publicSite.audience.items.${id}.title`)}
                </h3>
                <span className="public-audience-card__more">
                  {t('publicSite.audience.more')}
                </span>
              </div>
              <img
                className="public-audience-card__img"
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </PublicHashLink>
          ))}
        </div>
      </div>
    </section>
  );
}
