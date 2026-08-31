import { Link, useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath, isDesktopCashier } from '../../../utils/authLogin';

/**
 * Хедер: бренд + Главная слева; справа язык, одна кнопка «Скачать кассу», входы.
 */
export default function PublicSiteHeader({ showLoginCta = true }) {
  const { t } = useTranslation();
  const location = useLocation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const homeActive = location.pathname === '/login' || location.pathname === '/';
  const installActive = location.pathname === '/install';
  const showDownload = !isDesktopCashier();

  return (
    <header className="public-site-header">
      <div className="public-site-header__inner">
        <div className="public-site-header__left">
          <Link to="/login" className="public-site-header__brand">
            <span className="public-site-header__mark">
              <BrandMark size={18} />
            </span>
            <span className="public-site-header__name">{displayAppName() || 'Aurent'}</span>
          </Link>

          <nav className="public-site-header__nav" aria-label={t('publicSite.navAria')}>
            <Link
              to="/login"
              className={`public-site-header__link${homeActive ? ' is-active' : ''}`}
            >
              {t('publicSite.home')}
            </Link>
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
            <Link to="/login" className="public-site-header__cta">
              {t('installer.goToLogin')}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
