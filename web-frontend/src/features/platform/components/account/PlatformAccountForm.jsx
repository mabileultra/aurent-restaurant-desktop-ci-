import { KeyRound } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformAccountForm({
  t,
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  onSubmit,
  saving,
  loading,
}) {
  if (loading) {
    return <p className="platform-account__empty">{t('common.loading')}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="platform-account__form">
      <BaseInput
        label={t('platform.account.login')}
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
        autoComplete="username"
        required
      />
      <BaseInput
        label={t('platform.account.newPassword')}
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete="new-password"
        minLength={6}
      />
      <BaseInput
        label={t('platform.account.confirmPassword')}
        type="password"
        value={passwordConfirm}
        onChange={(e) => onPasswordConfirmChange(e.target.value)}
        autoComplete="new-password"
      />
      <div className="platform-account__actions">
        <BaseButton type="submit" disabled={saving}>
          <KeyRound size={16} />
          {t('platform.account.save')}
        </BaseButton>
      </div>
    </form>
  );
}
