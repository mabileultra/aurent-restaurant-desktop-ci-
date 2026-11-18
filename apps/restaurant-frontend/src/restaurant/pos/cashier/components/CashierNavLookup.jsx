import { useEffect, useRef, useState } from 'react';
import { Download, Info, Menu, RefreshCw } from 'lucide-react';
import { AboutAppModal } from '@aurent/shared-ui';
import { CASHIER_TAB_ICONS } from '../config/cashierNavIcons';
import { CASHIER_TABS } from '../utils/cashierNav';
import { useRestaurantDesktopUpdate } from '../hooks/useRestaurantDesktopUpdate';
import CashierTaxToggle from './CashierTaxToggle';
import CashierNavUpdateBlock from './CashierNavUpdateBlock';
import CashierNavDownloadFloat from './CashierNavDownloadFloat';
import CashierNavShiftHeader from './CashierNavShiftHeader';
import CashierNavTriggerButton from './CashierNavTriggerButton';
import RestaurantDesktopWifiFooter from '../../components/RestaurantDesktopWifiFooter';
import '../styles/cashier-nav-lookup.css';

export default function CashierNavLookup({
  activeTab,
  onSelect,
  disabledKeys = [],
  tabs = CASHIER_TABS,
  shift = null,
  shiftOpenLabel = null,
  storeId = null,
  t,
}) {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const rootRef = useRef(null);
  const {
    isDesktop,
    update,
    checking,
    hasBadge,
    badgeUrgent,
    checkAppUpdates,
    runUpdateAction,
  } = useRestaurantDesktopUpdate(t);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const updateTitle = update
    ? t(update.titleKey, update.titleParams || {})
    : null;
  const updateBody = update
    ? t(update.bodyKey, update.bodyParams || {})
    : null;

  const downloading = update?.updateState === 'progress' || update?.updateState === 'available';
  const downloadPercent = Math.max(0, Math.min(100, Number(update?.percent) || 0));
  const showBusy = checking || downloading;
  const toggleLabel = downloading
    ? t('rst.cashier.updateDownloadingTitle')
    : checking
      ? t('rst.cashier.checkUpdatesChecking')
      : t('rst.cashier.navLabel');

  return (
    <div className="rst-cashier-nav-lookup" ref={rootRef}>
      <CashierNavTriggerButton
        open={open}
        setOpen={setOpen}
        hasBadge={hasBadge}
        badgeUrgent={badgeUrgent}
        showBusy={showBusy}
        downloading={downloading}
        downloadPercent={downloadPercent}
        updateState={update?.updateState}
        toggleLabel={toggleLabel}
      />

      <CashierNavDownloadFloat
        open={open}
        downloading={downloading}
        downloadPercent={downloadPercent}
        updateState={update?.updateState}
        t={t}
      />

      {open ? (
        <div className="rst-cashier-nav-lookup__panel" role="menu">
          <CashierNavShiftHeader
            shift={shift}
            shiftOpenLabel={shiftOpenLabel}
            t={t}
          />
          <CashierTaxToggle storeId={storeId} t={t} />
          {(tabs || CASHIER_TABS).map((item) => {
            const Icon = CASHIER_TAB_ICONS[item.key];
            const active = activeTab === item.key
              || (item.key === 'hall' && !activeTab)
              || (item.key === 'tables' && (activeTab === 'tables' || !activeTab));
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`rst-cashier-nav-lookup__item${active ? ' is-active' : ''}`}
                disabled={disabledKeys.includes(item.key)}
                onClick={() => {
                  onSelect?.(item.key);
                  setOpen(false);
                }}
              >
                {Icon ? <Icon size={20} strokeWidth={2.2} aria-hidden /> : null}
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}

          {isDesktop ? (
            <>
              <div className="rst-cashier-nav-lookup__sep" role="separator" />
              <CashierNavUpdateBlock
                update={update}
                downloading={downloading}
                downloadPercent={downloadPercent}
                updateTitle={updateTitle}
                updateBody={updateBody}
                runUpdateAction={runUpdateAction}
                setOpen={setOpen}
                t={t}
              />
              <button
                type="button"
                role="menuitem"
                className="rst-cashier-nav-lookup__item"
                disabled={checking || downloading}
                onClick={() => {
                  void checkAppUpdates();
                }}
              >
                <Download size={20} strokeWidth={2.2} aria-hidden />
                <span>
                  {checking
                    ? t('rst.cashier.checkUpdatesChecking')
                    : downloading
                      ? t('rst.cashier.updateDownloadingTitle')
                      : t('rst.cashier.checkUpdates')}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="rst-cashier-nav-lookup__item"
                onClick={() => {
                  setOpen(false);
                  setAboutOpen(true);
                }}
              >
                <Info size={20} strokeWidth={2.2} aria-hidden />
                <span>{t('rst.cashier.aboutApp', { defaultValue: 'Dastur haqida' })}</span>
              </button>
              <RestaurantDesktopWifiFooter />
            </>
          ) : (
            <>
              <div className="rst-cashier-nav-lookup__sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="rst-cashier-nav-lookup__item"
                onClick={() => {
                  setOpen(false);
                  setAboutOpen(true);
                }}
              >
                <Info size={20} strokeWidth={2.2} aria-hidden />
                <span>{t('rst.cashier.aboutApp', { defaultValue: 'Dastur haqida' })}</span>
              </button>
            </>
          )}
        </div>
      ) : null}

      <AboutAppModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        appName={t('rst.brand.appName', { defaultValue: 'Aurent Restoran' })}
        t={t}
      />
    </div>
  );
}
