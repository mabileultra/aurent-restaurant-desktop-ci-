import { CheckCircle2 } from 'lucide-react';
import DesktopProductCard from './DesktopProductCard';
import { isArm64OnlyMacInstaller, isLikelyIntelMac } from '../utils/installerPlatformHint';

export default function DesktopInstallerHero({
  t,
  cashier,
  restaurant,
}) {
  const macArm64Only = isArm64OnlyMacInstaller(cashier.manifest);
  const showIntelMacWarning = macArm64Only && isLikelyIntelMac();

  return (
    <section className="installer-hero">
      <div className="installer-hero__inner">
        <span className="installer-hero__badge">
          <CheckCircle2 size={14} aria-hidden />
          {cashier.version
            ? t('installer.versionBadge', { version: cashier.version })
            : t('installer.versionBadgeFallback')}
        </span>

        <h1 className="installer-hero__title">
          <span className="installer-hero__title-kassa">{t('installer.pageTitle')} </span>
          <span className="installer-hero__title-brand">{t('installer.pageTitleBrand')}</span>
        </h1>

        <p className="installer-hero__subtitle">{t('installer.pageSubtitle')}</p>

        <div className="installer-products" role="list">
          <div role="listitem">
            <DesktopProductCard
              t={t}
              title={t('installer.cashierTitle')}
              brand={t('installer.heroTitleBrand')}
              description={t('installer.cashierSubtitle')}
              accent="green"
              manifest={cashier.manifest}
              version={cashier.version}
              releasedAt={cashier.releasedAt}
              isLoading={cashier.isLoading}
              isError={cashier.isError}
            />
          </div>
          <div role="listitem">
            <DesktopProductCard
              t={t}
              title={t('installer.restaurantTitle')}
              brand={t('installer.heroTitleBrand')}
              description={t('installer.restaurantSubtitle')}
              accent="slate"
              manifest={restaurant.manifest}
              version={restaurant.version}
              releasedAt={restaurant.releasedAt}
              isLoading={restaurant.isLoading}
              isError={restaurant.isError}
              unavailableText={t('installer.restaurantComingSoon')}
            />
          </div>
        </div>

        {showIntelMacWarning ? (
          <p className="installer-hero__meta installer-hero__meta--warn" role="status">
            {t('installer.macIntelUnsupported')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
