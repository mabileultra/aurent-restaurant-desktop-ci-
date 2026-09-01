import { useTranslation } from 'react-i18next';
import PublicLazyImage from '../shared/PublicLazyImage';
import { PUBLIC_HERO_MEDIA } from '../../constants/publicSiteMedia';
import { PUBLIC_SITE_SECTIONS } from '../../constants/publicSiteSections';

export default function PublicHeroDevices() {
  const { t } = useTranslation();

  return (
    <div className="public-hero-devices" aria-hidden={false}>
      <div className="public-hero-devices__glow" aria-hidden />
      <div className="public-hero-devices__tablet">
        <div className="public-hero-devices__bezel">
          <PublicLazyImage
            src={PUBLIC_HERO_MEDIA.tablet}
            alt={t('publicSite.homePage.tabletAlt')}
            loading="eager"
            sizes="(max-width: 960px) 90vw, 580px"
          />
        </div>
      </div>
      <div className="public-hero-devices__phone">
        <div className="public-hero-devices__bezel public-hero-devices__bezel--phone">
          <PublicLazyImage
            src={PUBLIC_HERO_MEDIA.phone}
            alt={t('publicSite.homePage.phoneAlt')}
            loading="eager"
            sizes="195px"
          />
        </div>
      </div>
    </div>
  );
}
