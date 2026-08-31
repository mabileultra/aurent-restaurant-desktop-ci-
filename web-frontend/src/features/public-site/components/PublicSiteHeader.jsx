import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath, isDesktopCashier } from '../../../utils/authLogin';
import { PUBLIC_SITE_NAV } from '../constants/publicSiteNav';

/**
 * Хедер публичного сайта: навигация, язык, скачивание кассы, вход.
 */
export default function PublicSiteHeader({ showLoginCta = true }) {
  const { t } = useTranslation();
  const location = useLocation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const installActive = location.pathname === '/install';
  const showDownload = !isDesktopCashier();
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);

  useEffect(() => {
    setLoginOpen(false);
  }, [location.pathname]);

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

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
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
            {PUBLIC_SITE_NAV.map(({ to, key }) => (
              <Link
                key={to}
                to={to}
                className={`public-site-header__link${isActive(to) ? ' is-active' : ''}`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="public-site-header__actions">
          <LanguageSwitcher className="public-site-header__lang" variant="public" />
          {showDownload ? (
            <Link
              to="/install"
              className={`public-site-header__download${installActive ? ' is-active' : ''}`}
              aria-current={installActive ? 'page' : undefined}
            >
              <Download size={16} aria-hidden />
              {t('login.downloadCashier')}
            </Link>
          ) : null}
          <Link to={cashierLoginPath()} className="public-site-header__ghost">
            {t('cashierLogin.backToCashier')}
          </Link>
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
        </div>
      </div>
    </header>
  );
}
