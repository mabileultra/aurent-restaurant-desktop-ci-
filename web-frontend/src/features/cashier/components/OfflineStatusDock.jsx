import { Wifi, WifiOff, Loader2 } from 'lucide-react';

/**
 * Bottom-right online/offline chip. Shows sync phase while reconnect runs.
 */
export default function OfflineStatusDock({ status }) {
  const busy = Boolean(status.syncing);
  const StatusIcon = busy ? Loader2 : status.showOffline ? WifiOff : Wifi;

  return (
    <div
      className={`offline-topbar offline-topbar--dock offline-topbar--${status.tone}${busy ? ' is-syncing' : ''}`}
      role="status"
      title={status.message}
    >
      <span className="offline-topbar__status">
        <span className="offline-topbar__icon" aria-hidden>
          <StatusIcon
            size={14}
            strokeWidth={2.25}
            className={busy ? 'offline-topbar__spin' : undefined}
          />
        </span>
        <span className="offline-topbar__label">{status.shortLabel}</span>
      </span>
    </div>
  );
}
