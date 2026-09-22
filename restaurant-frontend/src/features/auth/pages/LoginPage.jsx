import { Link } from 'react-router-dom';
import LoginBranding from '../components/LoginBranding';
import LoginForm from '../components/LoginForm';
import { useLoginPage } from '../hooks/useLoginPage';
import RestaurantDesktopDownloadCorner from '../../desktop-download/components/RestaurantDesktopDownloadCorner';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import '../../../styles/auth/login-page.css';

export default function LoginPage() {
  const {
    t,
    showPass,
    toggleShowPass,
    loading,
    form,
    onSubmit,
  } = useLoginPage();

  return (
    <div className="public-site rst-login-page">
      <RestaurantDesktopDownloadCorner />
      <header className="rst-login-page__brand">
        <Link to="/login" className="rst-login-page__brand-link">
          Aurent Restaurant
        </Link>
        <LanguageSwitcher variant="rst" />
      </header>
      <main className="public-site__main login-page__stage">
        <div className="login-card">
          <LoginBranding
            title={t('login.title')}
            subtitle={t('login.subtitle')}
          />
          <LoginForm
            t={t}
            form={form}
            showPass={showPass}
            onToggleShowPass={toggleShowPass}
            loading={loading}
            onSubmit={onSubmit}
          />
          <p className="login-card__secure">{t('login.securityBadge')}</p>
        </div>
      </main>
    </div>
  );
}
