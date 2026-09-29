import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import PosZoomControls from '../../components/PosZoomControls';
import { BaseButton } from '../../../../components/ui';
import { logoutAndResetSession } from '../../../../utils/authSession';
import DesktopAdminEntry from '../../../shared/components/DesktopAdminEntry';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-shell.css';

export default function CashierTopBar({
  storeName,
  shift,
  shiftOpenLabel,
  zoom,
  userLabel,
  t,
}) {
  return (
    <header className="rst-cashier-top">
      <DesktopAdminEntry label={t('cashierLogin.adminLogin')} />
      <div className="rst-cashier-top__brand">
        <span className="rst-cashier-top__name">{t('rst.cashier.title')}</span>
        <span className="rst-cashier-top__meta">
          {storeName || t('rst.floor.hall')}
          {userLabel ? ` · ${userLabel}` : ''}
        </span>
      </div>

      <div className={`rst-cashier-top__shift${shift ? ' is-open' : ''}`}>
        {shift ? (
          <>
            <strong>{t('rst.cashier.shiftOpen')}</strong>
            {shiftOpenLabel ? <span>{shiftOpenLabel}</span> : null}
            <span>{t('rst.shift.total')}: {fmtMoneyCompact(shift.totalAmount)}</span>
          </>
        ) : (
          <strong>{t('rst.cashier.shiftClosed')}</strong>
        )}
      </div>

      <div className="rst-cashier-top__actions">
        <PosZoomControls zoom={zoom} t={t} />
        <RestaurantThemeSwitch />
        <LanguageSwitcher variant="rst" />
        <BaseButton
          type="button"
          variant="ghost"
          className="rst-exit-btn"
          onClick={() => logoutAndResetSession()}
        >
          {t('nav.logout')}
        </BaseButton>
      </div>
    </header>
  );
}
