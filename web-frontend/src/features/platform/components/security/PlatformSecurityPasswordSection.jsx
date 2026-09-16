import { KeyRound } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

export default function PlatformSecurityPasswordSection({
  t,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  passwordStatus,
  passwordLoading,
  onSubmit,
  saving,
}) {
  return (
    <section className="platform-security__card">
      <div className="platform-security__card-head">
        <span className="platform-security__icon" aria-hidden>
          <KeyRound size={16} />
        </span>
        <div className="platform-security__titles">
          <h2 className="platform-security__title">{t('platform.security.cashierPasswordTitle')}</h2>
          <p className="platform-security__hint">{t('platform.security.cashierPasswordHint')}</p>
        </div>
      </div>
      <p className="platform-security__note">{t('platform.security.cashierPasswordDefault')}</p>
      {passwordLoading ? (
        <p className="platform-security__empty">{t('common.loading')}</p>
      ) : (
        <form onSubmit={onSubmit} className="platform-security__form">
          <div className="platform-security__field">
            <label htmlFor="platform-security-password">{t('platform.security.newPassword')}</label>
            <input
              id="platform-security-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="platform-security__field">
            <label htmlFor="platform-security-password-confirm">{t('platform.security.confirmPassword')}</label>
            <input
              id="platform-security-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => onPasswordConfirmChange(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="platform-security__actions">
            <span className="platform-security__updated">
              {passwordStatus?.updatedAt
                ? t('platform.security.passwordUpdatedAt', { date: passwordStatus.updatedAt })
                : ''}
            </span>
            <BaseButton type="submit" disabled={saving}>
              {t('platform.security.savePassword')}
            </BaseButton>
          </div>
        </form>
      )}
    </section>
  );
}
