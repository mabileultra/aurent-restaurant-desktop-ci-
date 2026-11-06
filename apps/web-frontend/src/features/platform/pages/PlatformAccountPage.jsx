import { PageLayout } from '../../../components/ui';
import PlatformAccountForm from '../components/account/PlatformAccountForm';
import { usePlatformAccountPage } from '../hooks/usePlatformAccountPage';
import '../../../styles/platform/account.css';

export default function PlatformAccountPage() {
  const p = usePlatformAccountPage();

  return (
    <PageLayout
      className="platform-account"
      spacing="space-y-4"
      title={p.t('platform.account.title')}
      subtitle={p.t('platform.account.subtitle')}
    >
      <section className="platform-account__card">
        <p className="platform-account__hint">{p.t('platform.account.hint')}</p>
        <PlatformAccountForm
          t={p.t}
          username={p.username}
          onUsernameChange={p.setUsername}
          onSubmit={p.handleSubmit}
          saving={p.saving}
          loading={p.isLoading}
        />
      </section>
    </PageLayout>
  );
}
