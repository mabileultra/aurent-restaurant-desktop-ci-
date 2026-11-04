import { AlertTriangle, Download, MessageSquare } from 'lucide-react';
import './cashier-notification-alert-modal.css';

function kindIcon(kind) {
  if (kind === 'UPDATE') return Download;
  if (kind === 'ALERT') return AlertTriangle;
  return MessageSquare;
}

/** Blocking super-admin alert. OK dismisses (mark read). */
export default function CashierNotificationAlertModal({ item, title, body, actionLabel, onOk }) {
  if (!item) return null;
  const Icon = kindIcon(item.kind);
  return (
    <div className="cashier-notif-alert" role="alertdialog" aria-modal="true" aria-labelledby="cashier-notif-alert-title">
      <div className="cashier-notif-alert__card">
        <div className={`cashier-notif-alert__icon cashier-notif-alert__icon--${String(item.kind || 'MESSAGE').toLowerCase()}`}>
          <Icon size={22} strokeWidth={2.25} aria-hidden />
        </div>
        <h2 id="cashier-notif-alert-title" className="cashier-notif-alert__title">{title}</h2>
        {body ? <p className="cashier-notif-alert__body">{body}</p> : null}
        <button type="button" className="cashier-notif-alert__ok" onClick={() => onOk?.(item)}>
          {actionLabel || 'OK'}
        </button>
      </div>
    </div>
  );
}
