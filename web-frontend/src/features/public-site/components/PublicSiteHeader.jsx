import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath } from '../../../utils/authLogin';

/**
 * Общий хедер публичных страниц.
 * Без пунктов «Решения» / «Тарифы» — только Главная.
 */
export default function PublicSiteHeader({ showLoginCta = true }) {
  const { t } = useTranslation();
  const location = useLocation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const homeActive = location.pathname === '/install' || location.pathname === '/';

  return (
    <header className="public-site-header">
      <div className="public-site-header__inner">
        <Link to="/install" className="public-site-header__brand">
          <span className="public-site-header__mark">
            <BrandMark size={18} iconClassName="text-white" />
          </span>
          <span className="public-site-header__name">{displayAppName() || 'Aurent'}</span>
        </Link>

        <nav className="public-site-header__nav" aria-label={t('publicSite.navAria')}>
          <Link
            to="/install"
            className={`public-site-header__link${homeActive ? ' is-active' : ''}`}
          >
            {t('publicSite.home')}
          </Link>
        </nav>

        <div className="public-site-header__actions">
          <LanguageSwitcher className="public-site-header__lang" variant="public" />
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
