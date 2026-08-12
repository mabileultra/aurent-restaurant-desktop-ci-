import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicSiteHeader from '../../public-site/components/PublicSiteHeader';
import PublicSiteFooter from '../../public-site/components/PublicSiteFooter';
import DesktopInstallerHero from '../components/DesktopInstallerHero';
import DesktopInstallerFirstRunGuide from '../components/DesktopInstallerFirstRunGuide';
import { useDesktopInstallerPage } from '../hooks/useDesktopInstallerPage';
import '../../../styles/desktop/installer-page.css';

export default function DesktopInstallerPage() {
  const { t } = useTranslation();
  const { manifest, version, releasedAt, isLoading, isError } = useDesktopInstallerPage();

  return (
    <div className="public-site">
      <PublicSiteHeader />
      <main className="public-site__main installer-page__main">
        <DesktopInstallerHero
          t={t}
          manifest={manifest}
          version={version}
          releasedAt={releasedAt}
          isLoading={isLoading}
          isError={isError}
        />
        <DesktopInstallerFirstRunGuide t={t} />
        <p className="installer-page__account">
          {t('installer.alreadyHaveAccount')}{' '}
          <Link to="/login" className="installer-page__account-link">
            {t('installer.goToLogin')}
          </Link>
        </p>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
