import { useTranslation } from 'react-i18next';
import { PUBLIC_TERMINAL_MEDIA } from '../../constants/publicSiteMedia';
import { PUBLIC_SITE_SECTIONS } from '../../constants/publicSiteSections';
import PublicHashLink from '../shared/PublicHashLink';
import PublicDeviceFrame from '../shared/PublicDeviceFrame';
import PublicWaveDivider from '../layout/PublicWaveDivider';

export default function PublicTerminalSection() {
  const { t } = useTranslation();

  return (
    <>
      <PublicWaveDivider />
      <section className="public-feature-block" id={PUBLIC_SITE_SECTIONS.features}>
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
            <PublicDeviceFrame
              src={PUBLIC_TERMINAL_MEDIA.image}
              srcSet={PUBLIC_TERMINAL_MEDIA.srcSet}
              alt={PUBLIC_TERMINAL_MEDIA.alt}
              sizes="(max-width: 900px) 100vw, 500px"
            />
          </div>
        </div>
      </section>
    </>
  );
}
