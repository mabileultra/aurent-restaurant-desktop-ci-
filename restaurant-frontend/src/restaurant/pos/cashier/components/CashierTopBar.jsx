import { Link } from 'react-router-dom';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import { BaseButton } from '../../../../components/ui';
import { logoutAndResetSession } from '../../../../utils/authSession';
import { CASHIER_HEADER_TABS } from '../utils/cashierNav';
import CashierNavLookup from './CashierNavLookup';
import CashierQuickSaleButton from './CashierQuickSaleButton';
import PosEnterMobileButton from '../../pos-mobile/components/PosEnterMobileButton';
import WaiterMobileHeaderActions from '../../waiter-mobile/components/WaiterMobileHeaderActions';
import '../styles/cashier-shell.css';

export default function CashierTopBar({
  storeName,
  userLabel,
  canAdmin = false,
  backToCashier = null,
  activeTab = null,
  onSelectTab,
  disabledTabs = [],
  showEnterMobile = false,
  onEnterMobile,
  showExitMobile = false,
  onExitMobile,
  compactActions = false,
  /** Full-order desktop: Menu catalog search portal. */
  showMenuSearch = false,
  roleLabel = '',
  shift = null,
  shiftOpenLabel = null,
  storeId = null,
  quickSaleEnabled = false,
  onQuickSaleOpened,
  customerDisplayEnabled = false,
  onOpenCustomerDisplay,
  t,
}) {
  return (
    <header className={`rst-cashier-top${compactActions ? ' rst-cashier-top--compact' : ''}`}>
      {onSelectTab && !backToCashier && !compactActions ? (
        <CashierNavLookup
          activeTab={activeTab}
          onSelect={onSelectTab}
          disabledKeys={disabledTabs}
          shift={shift}
          shiftOpenLabel={shiftOpenLabel}
          storeId={storeId}
          t={t}
        />
      ) : null}

      <div className="rst-cashier-top__brand">
        {backToCashier ? (
          <BaseButton
            type="button"
            className="rst-cashier-top__back"
            onClick={backToCashier.onClick}
          >
            ← {backToCashier.label}
          </BaseButton>
        ) : (
          <>
            <span className="rst-cashier-top__name">{t('rst.cashier.title')}</span>
            <span className="rst-cashier-top__meta">
              {storeName || t('rst.floor.hall')}
              {!compactActions && userLabel ? ` · ${userLabel}` : ''}
            </span>
          </>
        )}
      </div>

      {showMenuSearch ? (
        <div id="rst-pos-search-slot" className="rst-cashier-top__search" />
      ) : null}

      {onSelectTab && !backToCashier && !compactActions ? (
        <div className="rst-cashier-top__quick" role="tablist" aria-label={t('rst.cashier.navLabel')}>
          {CASHIER_HEADER_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeTab === item.key}
              className={`rst-cashier-top__quick-btn${activeTab === item.key ? ' is-active' : ''}`}
              onClick={() => onSelectTab(activeTab === item.key ? 'hall' : item.key)}
            >
              {t(item.labelKey)}
            </button>
          ))}
          <CashierQuickSaleButton
            enabled={quickSaleEnabled}
            storeId={storeId}
            shift={shift}
            onOpened={onQuickSaleOpened}
            t={t}
          />
        </div>
      ) : null}

      <div className="rst-cashier-top__actions">
        {compactActions ? (
          <WaiterMobileHeaderActions
            enabled
            displayName={userLabel || ''}
            storeName={storeName || ''}
            roleLabel={roleLabel || t('roles.CASHIER', { defaultValue: 'Кассир' })}
            canAdmin={canAdmin}
            canCashier={false}
            showExitMobile={showExitMobile}
            onExitMobile={onExitMobile}
          />
        ) : (
          <>
            {canAdmin ? (
              <Link to="/rst/admin/dashboard" className="rst-cashier-top__admin">
                <BaseButton type="button" variant="primary">{t('rst.pos.toAdmin')}</BaseButton>
              </Link>
            ) : null}
            {customerDisplayEnabled && typeof onOpenCustomerDisplay === 'function' ? (
              <BaseButton
                type="button"
                variant="ghost"
                className="rst-cashier-top__cfd"
                onClick={onOpenCustomerDisplay}
              >
                {t('rst.cfd.open')}
              </BaseButton>
            ) : null}
            <RestaurantThemeSwitch />
            <LanguageSwitcher variant="rst" />
            {showEnterMobile ? <PosEnterMobileButton onEnter={onEnterMobile} /> : null}
            {showExitMobile ? (
              <BaseButton
                type="button"
                variant="ghost"
                className="rst-cashier-top__exit-mobile"
                onClick={onExitMobile}
              >
                {t('rst.mobile.exitShort', { defaultValue: 'ПК' })}
              </BaseButton>
            ) : null}
            <BaseButton
              type="button"
              variant="ghost"
              className="rst-exit-btn"
              onClick={() => logoutAndResetSession()}
            >
              {t('nav.logout')}
            </BaseButton>
          </>
        )}
      </div>
    </header>
  );
}
