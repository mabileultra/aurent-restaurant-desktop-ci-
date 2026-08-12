import { Navigate } from 'react-router-dom';
import PublicSiteHeader from '../../public-site/components/PublicSiteHeader';
import PublicSiteFooter from '../../public-site/components/PublicSiteFooter';
import LoginBranding from '../components/LoginBranding';
import LoginForm from '../components/LoginForm';
import { useLoginPage } from '../hooks/useLoginPage';
import '../../../styles/auth/login-page.css';

export default function LoginPage() {
  const {
    t,
    shouldRedirectToCashierLogin,
    cashierLoginPath,
    showPass,
    toggleShowPass,
    loading,
    form,
    onSubmit,
  } = useLoginPage();

  if (shouldRedirectToCashierLogin) {
    return <Navigate to={cashierLoginPath()} replace />;
  }

  return (
    <div className="public-site">
      <PublicSiteHeader showLoginCta={false} />
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
      <PublicSiteFooter />
    </div>
  );
}
