import { Link } from 'react-router-dom';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import { BaseButton } from '../../../../components/ui';
import { logoutAndResetSession } from '../../../../utils/authSession';
import { CASHIER_HEADER_TABS } from '../utils/cashierNav';
import CashierNavLookup from './CashierNavLookup';
import PosEnterMobileButton from '../../pos-mobile/components/PosEnterMobileButton';
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
  t,
}) {
  return (
    <header className={`rst-cashier-top${compactActions ? ' rst-cashier-top--compact' : ''}`}>
      {onSelectTab && !backToCashier && !compactActions ? (
        <CashierNavLookup activeTab={activeTab} onSelect={onSelectTab} disabledKeys={disabledTabs} t={t} />
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
              {userLabel ? ` · ${userLabel}` : ''}
            </span>
          </>
        )}
      </div>

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
        </div>
      ) : null}

      <div className="rst-cashier-top__actions">
        {!compactActions && canAdmin ? (
          <Link to="/rst/admin/dashboard" className="rst-cashier-top__admin">
            <BaseButton type="button" variant="ghost">{t('rst.pos.backToAdmin')}</BaseButton>
          </Link>
        ) : null}
        {compactActions ? null : <RestaurantThemeSwitch />}
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
          {compactActions ? t('nav.logoutShort', { defaultValue: 'Выход' }) : t('nav.logout')}
        </BaseButton>
      </div>
    </header>
  );
}
