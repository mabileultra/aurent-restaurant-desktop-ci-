import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { PUBLIC_SITE_EMAIL, PUBLIC_SITE_PHONE, PUBLIC_SITE_PHONE_HREF } from '../constants/publicSiteMedia';
import { PUBLIC_SITE_NAV } from '../constants/publicSiteNav';

export default function PublicSiteFooter() {
  const { t } = useTranslation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const year = new Date().getFullYear();

  return (
    <footer className="public-site-footer">
      <div className="public-site-footer__inner">
        <div className="public-site-footer__top">
          <Link to="/" className="public-site-footer__brand">
            <span className="public-site-footer__mark">
              <BrandMark variant="full" height={16} />
            </span>
            {displayAppName() || 'Aurent'}
          </Link>
          <div className="public-site-footer__links">
            {PUBLIC_SITE_NAV.slice(0, 6).map(({ to, key }) => (
              <Link key={to} to={to.startsWith('/#') ? '/' : to} className="public-site-footer__link">
                {t(key)}
              </Link>
            ))}
          </div>
          <div className="public-site-footer__contact">
            <a href={PUBLIC_SITE_PHONE_HREF}>{PUBLIC_SITE_PHONE}</a>
            <span>{PUBLIC_SITE_EMAIL}</span>
          </div>
        </div>
        <p className="public-site-footer__copy">
          {t('publicSite.footerCopy', { year })}
        </p>
      </div>
    </footer>
  );
}
