import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath, isDesktopCashier } from '../../../utils/authLogin';
import { PUBLIC_SITE_NAV } from '../constants/publicSiteNav';
import { PUBLIC_SITE_SECTIONS, publicSectionRoute } from '../constants/publicSiteSections';
import { PUBLIC_SITE_PHONE, PUBLIC_SITE_PHONE_HREF } from '../constants/publicSiteMedia';

export default function PublicSiteHeader({ showLoginCta = true }) {
  const { t } = useTranslation();
  const location = useLocation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const showDownload = !isDesktopCashier();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loginRef = useRef(null);

  useEffect(() => {
    setLoginOpen(false);
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!loginOpen) return undefined;
    const onDocClick = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [loginOpen]);

  const isActive = (to) => {
    if (to === publicSectionRoute(PUBLIC_SITE_SECTIONS.top)) {
      return location.pathname === '/' && (!location.hash || location.hash === '#top');
    }
    if (to.startsWith('/#')) {
      return location.pathname === '/' && location.hash === to.slice(1);
    }
    return location.pathname === to;
  };

  const hashTarget = (to) => ({ pathname: '/', hash: to.replace('/#', '') });

  const navLink = ({ to, key, hash }) => {
    const className = `public-site-header__link${isActive(to) ? ' is-active' : ''}`;
    if (hash) {
      if (location.pathname === '/') {
        return (
          <a key={to} href={to.slice(1)} className={className}>
            {t(key)}
          </a>
        );
      }
      return (
        <Link key={to} to={hashTarget(to)} className={className}>
          {t(key)}
        </Link>
      );
    }
    return (
      <Link key={to} to={to} className={className}>
        {t(key)}
      </Link>
    );
  };

  return (
    <>
      <header className="public-site-header">
        <div className="public-site-header__inner">
          <div className="public-site-header__left">
            <Link to="/" className="public-site-header__brand">
              <span className="public-site-header__mark">
                <BrandMark variant="full" height={22} />
              </span>
              <span className="public-site-header__name">{displayAppName() || 'Aurent'}</span>
            </Link>

            <nav className="public-site-header__nav" aria-label={t('publicSite.navAria')}>
              {PUBLIC_SITE_NAV.filter(({ to }) => showDownload || to !== '/install').map(navLink)}
            </nav>
          </div>

          <div className="public-site-header__actions">
            <a href={PUBLIC_SITE_PHONE_HREF} className="public-site-header__phone">
              {PUBLIC_SITE_PHONE}
            </a>
            <LanguageSwitcher className="public-site-header__lang" variant="public" />
            {showLoginCta ? (
              <div className="public-site-header__login-wrap" ref={loginRef}>
                <button
                  type="button"
                  className="public-site-header__login-btn"
                  onClick={() => setLoginOpen((v) => !v)}
                  aria-expanded={loginOpen}
                >
                  {t('publicSite.login')}
                  <ChevronDown size={16} aria-hidden />
                </button>
                {loginOpen ? (
                  <div className="public-site-header__login-menu">
                    <Link to="/login" className="public-site-header__login-item">
                      {t('publicSite.loginAdmin')}
                    </Link>
                    <Link to={cashierLoginPath()} className="public-site-header__login-item">
                      {t('publicSite.loginCashier')}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="public-site-header__burger"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.expandMenu')}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`public-site-header__mobile-nav${mobileOpen ? ' is-open' : ''}`}
        aria-label={t('publicSite.navAria')}
      >
        {PUBLIC_SITE_NAV.filter(({ to }) => showDownload || to !== '/install').map(({ to, key, hash }) => {
          if (hash && location.pathname === '/') {
            return (
              <a
                key={to}
                href={to.slice(1)}
                className="public-site-header__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {t(key)}
              </a>
            );
          }
          if (hash) {
            return (
              <Link
                key={to}
                to={hashTarget(to)}
                className="public-site-header__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {t(key)}
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className="public-site-header__mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {t(key)}
            </Link>
          );
        })}
        <a href={PUBLIC_SITE_PHONE_HREF} className="public-site-header__mobile-link">
          {PUBLIC_SITE_PHONE}
        </a>
      </nav>
    </>
  );
}
