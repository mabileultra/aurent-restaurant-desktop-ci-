import { Eye, EyeOff, Loader, Lock, ArrowRight, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginForm({
  t,
  form,
  showPass,
  onToggleShowPass,
  loading,
  onSubmit,
}) {
  const { register, formState: { errors } } = form;

  const onForgot = () => {
    toast(t('login.forgotHint'));
  };

  return (
    <form onSubmit={onSubmit} className="login-form" noValidate>
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-username">
          {t('login.username')}
        </label>
        <div className="login-form__control">
          <UserRound size={18} className="login-form__icon" aria-hidden />
          <input
            id="login-username"
            {...register('username')}
            autoComplete="username"
            placeholder={t('login.usernamePh')}
            className="login-form__input"
          />
        </div>
        {errors.username ? (
          <p className="login-form__error">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="login-form__field">
        <div className="login-form__label-row">
          <label className="login-form__label" htmlFor="login-password">
            {t('login.password')}
          </label>
          <button type="button" className="login-form__forgot" onClick={onForgot}>
            {t('login.forgotPassword')}
          </button>
        </div>
        <div className="login-form__control">
          <Lock size={18} className="login-form__icon" aria-hidden />
          <input
            id="login-password"
            {...register('password')}
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="login-form__input"
          />
          <button
            type="button"
            className="login-form__eye"
            onClick={onToggleShowPass}
            aria-label={showPass ? t('login.hidePassword') : t('login.showPassword')}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? (
          <p className="login-form__error">{errors.password.message}</p>
        ) : null}
      </div>

      <label className="login-form__remember">
        <input type="checkbox" {...register('remember')} />
        <span>{t('login.rememberMe')}</span>
      </label>

      <button type="submit" className="login-form__submit" disabled={loading}>
        {loading ? <Loader size={18} className="animate-spin" /> : null}
        <span>{loading ? t('common.signingIn') : t('login.signIn')}</span>
        {!loading ? <ArrowRight size={18} aria-hidden /> : null}
      </button>
    </form>
  );
}
