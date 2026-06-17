import { Bell } from 'lucide-react';
import CashierNotificationsPanel from './CashierNotificationsPanel';
import { useCashierNotifications } from '../../hooks/useCashierNotifications';

export default function CashierNotificationsBell() {
  const notifications = useCashierNotifications();
  if (!notifications) return null;

  const { t, rootRef, open, setOpen, unreadCount } = notifications;

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
    </div>
  );
}
