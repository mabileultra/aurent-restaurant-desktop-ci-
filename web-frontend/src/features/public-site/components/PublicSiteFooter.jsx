import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { PUBLIC_SITE_EMAIL, PUBLIC_SITE_PHONE, PUBLIC_SITE_PHONE_HREF } from '../constants/publicSiteMedia';

const FOOTER_COLUMNS = [
  {
    titleKey: 'publicSite.footer.col1Title',
    links: [
      { key: 'publicSite.footer.col1Link1', hash: '#about' },
      { key: 'publicSite.footer.col1Link2', hash: '#pricing' },
      { key: 'publicSite.footer.col1Link3', hash: '#contacts' },
    ],
  },
  {
    titleKey: 'publicSite.footer.col2Title',
    links: [
      { key: 'publicSite.footer.col2Link1', hash: '#audience' },
      { key: 'publicSite.footer.col2Link2', hash: '#features' },
      { key: 'publicSite.footer.col2Link3', hash: '#equipment' },
    ],
  },
  {
    titleKey: 'publicSite.footer.col3Title',
    links: [
      { key: 'publicSite.footer.col3Link1', to: '/login' },
      { key: 'publicSite.footer.col3Link2', hash: '#contacts' },
      { key: 'publicSite.footer.col3Link3', to: '/install' },
    ],
  },
];

function FooterLink({ hash, to, label, pathname }) {
  if (hash) {
    if (pathname === '/') {
      return <a href={hash}>{label}</a>;
    }
    return <Link to={{ pathname: '/', hash }}>{label}</Link>;
  }
  return <Link to={to}>{label}</Link>;
}

export default function PublicSiteFooter() {
  const { t } = useTranslation();
  const location = useLocation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const year = new Date().getFullYear();

  return (
    <footer className="public-site-footer">
      <div className="public-site-footer__inner">
        <div className="public-site-footer__grid">
          <div className="public-site-footer__brand-col">
            <Link to="/" className="public-site-footer__brand">
              <span className="public-site-footer__mark">
                <BrandMark variant="full" height={16} />
              </span>
              {displayAppName() || 'Aurent'}
            </Link>
            <p className="public-site-footer__tagline">{t('publicSite.footer.tagline')}</p>
            <div className="public-site-footer__contact">
              <a href={PUBLIC_SITE_PHONE_HREF}>{PUBLIC_SITE_PHONE}</a>
              <span>{PUBLIC_SITE_EMAIL}</span>
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.titleKey} className="public-site-footer__col">
              <h3>{t(col.titleKey)}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.key}>
                    <FooterLink
                      hash={link.hash}
                      to={link.to}
                      label={t(link.key)}
                      pathname={location.pathname}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="public-site-footer__copy">
          {t('publicSite.footerCopy', { year })}
        </p>
      </div>
    </footer>
  );
}
