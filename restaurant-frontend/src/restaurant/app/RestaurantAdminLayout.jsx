import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { BaseButton } from '../../components/ui';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';
import { isRestaurantWorldBusiness } from '../../utils/appHomePath';
import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import { visibleRstAdminNavGroups } from './restaurantAdminNav';
import RestaurantAdminNav from '../admin/components/RestaurantAdminNav';
import RstWorkspaceStorePicker from '../shared/components/RstWorkspaceStorePicker';
import { getMainAppUrl } from '../../config/mainAppUrl';
import '../shared/styles/restaurant-tokens.css';
import '../admin/styles/admin-shell.css';
import '../admin/styles/rst-billing.css';

export default function RestaurantAdminLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { businessType } = useCompanyBusinessType();
  const restaurantOnly = isRestaurantWorldBusiness(businessType);
  const groups = visibleRstAdminNavGroups(user?.role);

  return (
    <BillingAccessGuard>
      <div className="rst-app rst-shell">
        <aside className="rst-shell__nav">
          <div className="rst-shell__brand">
            <span className="rst-shell__brand-kicker">{t('rst.brandKicker')}</span>
            <span className="rst-shell__brand-name">{t('rst.brand')}</span>
          </div>
          <RestaurantAdminNav groups={groups} t={t} />
          <div className="rst-shell__footer">
            <Link to="/rst/cashier">{t('rst.pos.toCashier')}</Link>
            <Link to="/rst/pos">{t('rst.pos.toFloor')}</Link>
            <Link to="/rst/kitchen">{t('rst.pos.toKitchen')}</Link>
            {!restaurantOnly ? (
              <a href={`${getMainAppUrl()}/dashboard`}>{t('rst.admin.toPlatform')}</a>
            ) : null}
          </div>
        </aside>
        <div className="rst-shell__main">
          <header className="rst-shell__top">
            <div className="rst-shell__top-left">
              <strong>{user?.fullName || user?.username || ''}</strong>
              <RstWorkspaceStorePicker t={t} />
            </div>
            <div className="rst-shell__actions">
              <LanguageSwitcher variant="rst" />
              <BaseButton type="button" variant="ghost" onClick={() => logoutAndResetSession()}>
                {t('nav.logout')}
              </BaseButton>
            </div>
          </header>
          <div className="rst-shell__content">
            <Outlet />
          </div>
        </div>
      </div>
    </BillingAccessGuard>
  );
}
