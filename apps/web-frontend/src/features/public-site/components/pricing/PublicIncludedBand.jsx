import { useTranslation } from 'react-i18next';
import { PUBLIC_INCLUDED_FEATURES } from '../../constants/publicSiteMedia';
import { PUBLIC_SITE_SECTIONS } from '../../constants/publicSiteSections';
import PublicHashLink from '../shared/PublicHashLink';

export default function PublicIncludedBand() {
  const { t } = useTranslation();

  return (
    <section className="public-included-band" id={PUBLIC_SITE_SECTIONS.pricing}>
      <div className="public-site-section">
        <div className="public-included-band__shell">
          <div className="public-included-band__left">
            <h2>{t('publicSite.included.leftTitle')}</h2>
            <p>{t('publicSite.included.leftText')}</p>
            <PublicHashLink to="#pricing-plans" className="public-btn public-btn--primary">
              {t('publicSite.included.ctaPricing')}
            </PublicHashLink>
          </div>
          <div className="public-included-band__right">
            <div className="public-included-band__right-head">
              <h3>{t('publicSite.included.rightTitle')}</h3>
              <p className="public-included-band__price">{t('publicSite.included.rightPrice')}</p>
            </div>
            <p className="public-included-band__intro">{t('publicSite.included.rightIntro')}</p>
            <ul className="public-included-band__list">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <li key={n}>{t(`publicSite.included.list${n}`)}</li>
              ))}
            </ul>
            <div className="public-included-band__features">
              {PUBLIC_INCLUDED_FEATURES.map(({ id }) => (
                <div key={id} className="public-included-feature">
                  <strong>{t(`publicSite.included.features.${id}.title`)}</strong>
                  {t(`publicSite.included.features.${id}.text`)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
