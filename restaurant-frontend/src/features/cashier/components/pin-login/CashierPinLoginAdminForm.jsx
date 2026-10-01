import { BaseButton, BaseInput } from '../../../../components/ui';

/** Password login for admin / manager from the PIN roster. */
export default function CashierPinLoginAdminForm({
  t,
  username,
  password,
  error,
  loading,
  showPass,
  onUsername,
  onPassword,
  onTogglePass,
  onSubmit,
  onBack,
}) {
  return (
    <div className="cashier-pin-roster__pin-step">
      <div className="cashier-pin-roster__pin-card cashier-pin-roster__admin-card">
        <button
          type="button"
          className="cashier-pin-roster__back"
          onClick={onBack}
          disabled={loading}
        >
          {t('common.back', { defaultValue: 'Назад' })}
        </button>

        <div className="cashier-pin-roster__pin-user">
          <span className="cashier-pin-roster__avatar cashier-pin-roster__avatar--admin" aria-hidden="true">
            A
          </span>
          <div>
            <p className="cashier-pin-roster__pin-name">
              {t('cashierLogin.adminTitle', { defaultValue: 'Админка' })}
            </p>
            <p className="cashier-pin-roster__pin-role">
              {t('cashierLogin.adminHint', { defaultValue: 'Логин и пароль' })}
            </p>
          </div>
        </div>

        <form
          className="cashier-pin-roster__admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <BaseInput
            label={t('login.username', { defaultValue: 'Логин' })}
            autoComplete="username"
            value={username}
            onChange={(e) => onUsername(e.target.value)}
            disabled={loading}
            required
          />
          <div className="cashier-pin-roster__admin-pass">
            <BaseInput
              label={t('login.password', { defaultValue: 'Пароль' })}
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="cashier-pin-roster__admin-pass-toggle"
              onClick={onTogglePass}
              disabled={loading}
            >
              {showPass
                ? t('login.hidePassword', { defaultValue: 'Скрыть' })
                : t('login.showPassword', { defaultValue: 'Показать' })}
            </button>
          </div>

          {error ? (
            <p className="cashier-pin-login__pin-error" role="alert">{error}</p>
          ) : null}

          <BaseButton type="submit" className="cashier-pin-login__submit" disabled={loading}>
            {loading
              ? t('common.loading', { defaultValue: 'Загрузка…' })
              : t('login.submit', { defaultValue: 'Войти' })}
          </BaseButton>
        </form>
      </div>
    </div>
  );
}
