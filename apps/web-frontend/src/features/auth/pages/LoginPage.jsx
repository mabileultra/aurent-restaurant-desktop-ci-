import { Navigate, Link } from 'react-router-dom';
import { Loader, Shield } from 'lucide-react';
import PublicSiteHeader from '../../public-site/components/PublicSiteHeader';
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
    twoFactorChallenge,
    twoFactorCode,
    setTwoFactorCode,
    onVerifyTwoFactor,
    cancelTwoFactor,
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
            subtitle={twoFactorChallenge
              ? t('login.twoFactorSubtitle', 'Authenticator ilovasidagi 6 xonali kod')
              : t('login.subtitle')}
          />
          {twoFactorChallenge ? (
            <form onSubmit={onVerifyTwoFactor} className="login-form" noValidate>
              <div className="login-form__field">
                <label className="login-form__label" htmlFor="login-2fa">
                  {t('login.twoFactorCode', '2FA kod')}
                </label>
                <div className="login-form__control">
                  <Shield size={18} className="login-form__icon" aria-hidden />
                  <input
                    id="login-2fa"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="login-form__input"
                    maxLength={6}
                  />
                </div>
              </div>
              <button type="submit" className="login-form__submit" disabled={loading || twoFactorCode.length < 6}>
                {loading ? <Loader size={18} className="animate-spin" /> : null}
                <span>{t('login.verifyTwoFactor', 'Tasdiqlash')}</span>
              </button>
              <button type="button" className="login-form__forgot" onClick={cancelTwoFactor}>
                {t('common.back', 'Orqaga')}
              </button>
            </form>
          ) : (
            <LoginForm
              t={t}
              form={form}
              showPass={showPass}
              onToggleShowPass={toggleShowPass}
              loading={loading}
              onSubmit={onSubmit}
            />
          )}
          <p className="login-card__secure">{t('login.securityBadge')}</p>
          {loading ? (
            <div className="login-card__busy" role="status">
              <Loader size={22} className="animate-spin" aria-hidden />
              <span>{t('common.signingIn')}</span>
            </div>
          ) : null}
        </div>
        <p className="login-page__back">
          <Link to="/">{t('publicSite.nav.home')}</Link>
        </p>
      </main>
    </div>
  );
}
