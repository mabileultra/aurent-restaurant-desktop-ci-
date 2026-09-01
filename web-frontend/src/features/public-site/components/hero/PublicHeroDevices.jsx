import { useTranslation } from 'react-i18next';
import { PUBLIC_HERO_MEDIA } from '../../constants/publicSiteMedia';

export default function PublicHeroDevices() {
  const { t } = useTranslation();

  return (
    <div className="public-hero-devices" aria-hidden={false}>
      <div className="public-hero-devices__glow" aria-hidden />
      <div className="public-hero-devices__tablet">
        <div className="public-hero-devices__bezel">
          <img
            src={PUBLIC_HERO_MEDIA.tablet}
            alt={t('publicSite.homePage.tabletAlt')}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
      <div className="public-hero-devices__phone">
        <div className="public-hero-devices__bezel public-hero-devices__bezel--phone">
          <img
            src={PUBLIC_HERO_MEDIA.phone}
            alt={t('publicSite.homePage.phoneAlt')}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
