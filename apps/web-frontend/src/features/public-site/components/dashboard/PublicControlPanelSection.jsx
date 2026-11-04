import { useTranslation } from 'react-i18next';
import { PUBLIC_CONTROL_PANEL_MEDIA } from '../../constants/publicSiteMedia';
import PublicHashLink from '../shared/PublicHashLink';
import PublicDeviceFrame from '../shared/PublicDeviceFrame';

export default function PublicControlPanelSection() {
  const { t } = useTranslation();

  return (
    <section className="public-control-panel" id="control-panel">
      <div className="public-site-section public-control-panel__inner">
        <h2 className="public-control-panel__title">{t('publicSite.controlPanel.title')}</h2>
        <p className="public-control-panel__text">{t('publicSite.controlPanel.text')}</p>
        <div className="public-control-panel__visual">
          <PublicDeviceFrame
            variant="wide"
            src={PUBLIC_CONTROL_PANEL_MEDIA.image}
            srcSet={PUBLIC_CONTROL_PANEL_MEDIA.srcSet}
            alt={PUBLIC_CONTROL_PANEL_MEDIA.alt}
            sizes="(max-width: 900px) 100vw, 720px"
          />
        </div>
        <PublicHashLink to="#contacts" className="public-btn public-btn--white">
          {t('publicSite.controlPanel.cta')}
        </PublicHashLink>
      </div>
    </section>
  );
}
