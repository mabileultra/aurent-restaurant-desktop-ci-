import { useEffect, useRef, useState } from 'react';
import { Download, Menu, RefreshCw, RotateCcw } from 'lucide-react';
import { CASHIER_TAB_ICONS } from '../config/cashierNavIcons';
import { CASHIER_TABS } from '../utils/cashierNav';
import { useRestaurantDesktopUpdate } from '../hooks/useRestaurantDesktopUpdate';
import '../styles/cashier-nav-lookup.css';

export default function CashierNavLookup({ activeTab, onSelect, disabledKeys = [], t }) {
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

  return (
    <div className="rst-cashier-nav-lookup" ref={rootRef}>
      <button
        type="button"
        className={`rst-cashier-nav-lookup__toggle${open ? ' is-open' : ''}${hasBadge ? ' has-update' : ''}${badgeUrgent ? ' has-update-urgent' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('rst.cashier.navLabel')}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu size={22} strokeWidth={2.4} aria-hidden />
        {hasBadge ? <span className="rst-cashier-nav-lookup__badge" aria-hidden /> : null}
      </button>

      {open ? (
        <div className="rst-cashier-nav-lookup__panel" role="menu">
          {CASHIER_TABS.map((item) => {
            const Icon = CASHIER_TAB_ICONS[item.key];
            const active = activeTab === item.key || (item.key === 'hall' && !activeTab);
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
                <div className="rst-cashier-nav-lookup__update">
                  <strong>{updateTitle}</strong>
                  <span>{updateBody}</span>
                  {update.updateState === 'progress' ? (
                    <div className="rst-cashier-nav-lookup__progress" aria-hidden>
                      <i style={{ width: `${Math.max(0, Math.min(100, update.percent || 0))}%` }} />
                    </div>
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
                disabled={checking}
                onClick={() => {
                  void checkAppUpdates();
                }}
              >
                <Download size={20} strokeWidth={2.2} aria-hidden />
                <span>
                  {checking
                    ? t('rst.cashier.checkUpdatesChecking')
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
