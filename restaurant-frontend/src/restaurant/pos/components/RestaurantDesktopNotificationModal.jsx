import { AlertTriangle, Download, MessageSquare } from 'lucide-react';
import './restaurant-desktop-notification-modal.css';

function kindIcon(kind) {
  if (kind === 'UPDATE') return Download;
  if (kind === 'ALERT') return AlertTriangle;
  return MessageSquare;
}

/**
 * Blocking super-admin broadcast. OK marks read and closes.
 */
export default function RestaurantDesktopNotificationModal({
  item,
  onOk,
  okLabel = 'OK',
}) {
  if (!item) return null;
  const Icon = kindIcon(item.kind);
  return (
    <div className="rst-desktop-notif" role="alertdialog" aria-modal="true" aria-labelledby="rst-desktop-notif-title">
      <div className="rst-desktop-notif__card">
        <div className={`rst-desktop-notif__icon rst-desktop-notif__icon--${String(item.kind || 'MESSAGE').toLowerCase()}`}>
          <Icon size={22} strokeWidth={2.25} aria-hidden />
        </div>
        <h2 id="rst-desktop-notif-title" className="rst-desktop-notif__title">{item.title}</h2>
        {item.body ? <p className="rst-desktop-notif__body">{item.body}</p> : null}
        <button type="button" className="rst-desktop-notif__ok" onClick={() => onOk?.(item)}>
          {item.actionLabel || okLabel}
        </button>
      </div>
    </div>
  );
}
