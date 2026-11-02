import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import CashierNotificationsPanel from './CashierNotificationsPanel';
import CashierNotificationAlertModal from './CashierNotificationAlertModal';
import { useCashierNotifications } from '../../hooks/useCashierNotifications';

export default function CashierNotificationsBell() {
  const notifications = useCashierNotifications();
  const updateTriggered = useRef(new Set());
  const active = notifications?.items?.[0] || null;

  useEffect(() => {
    if (!active || active.kind !== 'UPDATE') return;
    if (updateTriggered.current.has(active.id)) return;
    updateTriggered.current.add(active.id);
    if (typeof window.desktopCashier?.checkForUpdates === 'function') {
      void window.desktopCashier.checkForUpdates();
    }
  }, [active]);

  if (!notifications) return null;

  const {
    t,
    rootRef,
    open,
    setOpen,
    unreadCount,
    dismiss,
    resolveTitle,
    resolveBody,
    resolveAction,
  } = notifications;

  return (
    <div
      ref={rootRef}
      className={`cashier-notifications${open ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="cashier-notifications__trigger"
        aria-label={unreadCount > 0 ? t('notifications.bellAriaWithCount', { count: unreadCount }) : t('notifications.bellAria')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} strokeWidth={2.25} aria-hidden />
        {unreadCount > 0 ? (
          <span className="cashier-notifications__badge" aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? <CashierNotificationsPanel notifications={notifications} /> : null}
      <CashierNotificationAlertModal
        item={active}
        title={active ? resolveTitle(active) : ''}
        body={active ? resolveBody(active) : ''}
        actionLabel={active ? (resolveAction(active) || 'OK') : 'OK'}
        onOk={(item) => { void dismiss(item); }}
      />
    </div>
  );
}
