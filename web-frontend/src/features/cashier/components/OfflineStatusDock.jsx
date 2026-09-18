import { Wifi, WifiOff } from 'lucide-react';

/**
 * Bottom-right online/offline chip. Status only — catalog refresh lives in the desktop menu.
 */
export default function OfflineStatusDock({ status }) {
  const StatusIcon = status.showOffline ? WifiOff : Wifi;

  return (
    <div
      className={`offline-topbar offline-topbar--dock offline-topbar--${status.tone}`}
      role="status"
      title={status.message}
    >
      <span className="offline-topbar__status">
        <span className="offline-topbar__icon" aria-hidden>
          <StatusIcon size={14} strokeWidth={2.25} />
        </span>
        <span className="offline-topbar__label">{status.shortLabel}</span>
      </span>
    </div>
  );
}
