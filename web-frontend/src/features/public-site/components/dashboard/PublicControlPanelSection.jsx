import { useTranslation } from 'react-i18next';
import { PUBLIC_CONTROL_PANEL_MEDIA } from '../../constants/publicSiteMedia';
import PublicHashLink from '../shared/PublicHashLink';

export default function PublicControlPanelSection() {
  const { t } = useTranslation();

  return (
    <section className="public-control-panel" id="control-panel">
      <div className="public-site-section public-control-panel__inner">
        <h2 className="public-control-panel__title">{t('publicSite.controlPanel.title')}</h2>
        <p className="public-control-panel__text">{t('publicSite.controlPanel.text')}</p>
        <div className="public-control-panel__visual">
          <div className="public-control-panel__glow" aria-hidden />
          <img
            className="public-control-panel__img"
            src={PUBLIC_CONTROL_PANEL_MEDIA.image}
            alt={PUBLIC_CONTROL_PANEL_MEDIA.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
        <PublicHashLink to="#contacts" className="public-btn public-btn--white">
          {t('publicSite.controlPanel.cta')}
        </PublicHashLink>
      </div>
    </section>
  );
}
