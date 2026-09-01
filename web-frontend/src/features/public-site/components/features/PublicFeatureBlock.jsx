import { useTranslation } from 'react-i18next';
import { PUBLIC_FEATURE_MEDIA } from '../../constants/publicSiteMedia';
import PublicHashLink from '../shared/PublicHashLink';
import PublicWaveDivider from '../layout/PublicWaveDivider';

export default function PublicFeatureBlock({ sectionId, i18nKey, mediaKey, reversed = false }) {
  const { t } = useTranslation();
  const media = PUBLIC_FEATURE_MEDIA[mediaKey];

  return (
    <>
      <PublicWaveDivider />
      <section
        className={`public-feature-block${reversed ? ' public-feature-block--reversed' : ''}`}
        id={sectionId}
      >
        <div className="public-site-section public-feature-block__inner">
          <div className="public-feature-block__content">
            <p className="public-feature-block__label">{t(`publicSite.features.${i18nKey}.label`)}</p>
            <h2 className="public-feature-block__title">{t(`publicSite.features.${i18nKey}.title`)}</h2>
            <p className="public-feature-block__text">{t(`publicSite.features.${i18nKey}.text`)}</p>
            <PublicHashLink to="#contacts" className="public-btn public-btn--primary">
              {t(`publicSite.features.${i18nKey}.cta`)}
            </PublicHashLink>
          </div>
          <div className="public-feature-block__visual">
            <div className="public-feature-block__glow" aria-hidden />
            <img
              className="public-feature-block__img"
              src={media.image}
              alt={media.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </>
  );
}
