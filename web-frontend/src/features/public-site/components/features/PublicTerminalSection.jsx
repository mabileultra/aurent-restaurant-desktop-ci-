import { useTranslation } from 'react-i18next';
import { PUBLIC_TERMINAL_MEDIA } from '../../constants/publicSiteMedia';
import PublicHashLink from '../shared/PublicHashLink';
import PublicWaveDivider from '../layout/PublicWaveDivider';

export default function PublicTerminalSection() {
  const { t } = useTranslation();

  return (
    <>
      <PublicWaveDivider />
      <section className="public-feature-block" id="features">
        <div className="public-site-section public-feature-block__inner">
          <div className="public-feature-block__content">
            <p className="public-feature-block__label">{t('publicSite.terminal.label')}</p>
            <h2 className="public-feature-block__title">{t('publicSite.terminal.title')}</h2>
            <p className="public-feature-block__text">{t('publicSite.terminal.text')}</p>
            <PublicHashLink to="#contacts" className="public-btn public-btn--primary">
              {t('publicSite.terminal.cta')}
            </PublicHashLink>
          </div>
          <div className="public-feature-block__visual">
            <div className="public-feature-block__glow" aria-hidden />
            <img
              className="public-feature-block__img"
              src={PUBLIC_TERMINAL_MEDIA.image}
              alt={PUBLIC_TERMINAL_MEDIA.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </>
  );
}
