import { useEffect, useRef, useState } from 'react';
import { Download, Menu, RefreshCw, RotateCcw } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { CASHIER_TAB_ICONS } from '../config/cashierNavIcons';
import { CASHIER_TABS } from '../utils/cashierNav';
import { useRestaurantDesktopUpdate } from '../hooks/useRestaurantDesktopUpdate';
import CashierTaxToggle from './CashierTaxToggle';
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
      <button
        type="button"
        className={[
          'rst-cashier-nav-lookup__toggle',
          open ? 'is-open' : '',
          hasBadge ? 'has-update' : '',
          badgeUrgent ? 'has-update-urgent' : '',
          showBusy ? 'is-busy' : '',
          downloading ? 'is-downloading' : '',
        ].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={toggleLabel}
        aria-busy={showBusy || undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        {showBusy ? (
          <RefreshCw size={22} strokeWidth={2.4} className="rst-cashier-nav-lookup__spin" aria-hidden />
        ) : (
          <Menu size={22} strokeWidth={2.4} aria-hidden />
        )}
        {downloading ? (
          <span className="rst-cashier-nav-lookup__pct" aria-live="polite">
            {update?.updateState === 'progress' ? `${downloadPercent}%` : '…'}
          </span>
        ) : hasBadge ? (
          <span className="rst-cashier-nav-lookup__badge" aria-hidden />
        ) : null}
      </button>

      {!open && downloading ? (
        <div className="rst-cashier-nav-lookup__float" role="status" aria-live="polite">
          <strong>{t('rst.cashier.updateDownloadingTitle')}</strong>
          <span>
            {update?.updateState === 'progress'
              ? t('rst.cashier.updateDownloadingBody', { percent: downloadPercent })
              : t('rst.cashier.updateDownloadStarting', { defaultValue: 'Загрузка начинается…' })}
          </span>
          <div
            className="rst-cashier-nav-lookup__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={update?.updateState === 'progress' ? downloadPercent : undefined}
          >
            <i style={{ width: `${update?.updateState === 'progress' ? downloadPercent : 8}%` }} />
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="rst-cashier-nav-lookup__panel" role="menu">
          <div className={`rst-floor-hall-rail__shift rst-cashier-nav-lookup__shift${shift ? ' is-open' : ''}`}>
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
              {update ? (
                <div className={`rst-cashier-nav-lookup__update${downloading ? ' is-downloading' : ''}`}>
                  <strong>{updateTitle}</strong>
                  <span>{updateBody}</span>
                  {downloading ? (
                    <>
                      <div className="rst-cashier-nav-lookup__progress-meta">
                        <span>
                          {update.updateState === 'progress'
                            ? t('rst.cashier.updateDownloadingBody', { percent: downloadPercent })
                            : t('rst.cashier.updateDownloadStarting', { defaultValue: 'Загрузка начинается…' })}
                        </span>
                        {update.updateState === 'progress' ? (
                          <b>{downloadPercent}%</b>
                        ) : null}
                      </div>
                      <div
                        className="rst-cashier-nav-lookup__progress rst-cashier-nav-lookup__progress--lg"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={update.updateState === 'progress' ? downloadPercent : undefined}
                      >
                        <i style={{ width: `${update.updateState === 'progress' ? downloadPercent : 8}%` }} />
                      </div>
                    </>
                  ) : null}
                  {update.actionKey ? (
                    <button
                      type="button"
                      className="rst-cashier-nav-lookup__update-action"
                      onClick={() => {
                        void runUpdateAction();
                        if (update.updateState !== 'downloaded') setOpen(false);
                      }}
                    >
                      {update.updateState === 'downloaded' ? (
                        <RotateCcw size={16} strokeWidth={2.4} aria-hidden />
                      ) : (
                        <RefreshCw size={16} strokeWidth={2.4} aria-hidden />
                      )}
                      <span>{t(update.actionKey)}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
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
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
