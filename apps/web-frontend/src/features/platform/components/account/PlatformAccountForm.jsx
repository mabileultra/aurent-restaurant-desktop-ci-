import { KeyRound } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformAccountForm({
  t,
  username,
  onUsernameChange,
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
      <div className="platform-account__actions">
        <BaseButton type="submit" disabled={saving}>
          <KeyRound size={16} />
          {t('platform.account.save')}
        </BaseButton>
      </div>
    </form>
  );
}
