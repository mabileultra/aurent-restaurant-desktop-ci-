import { CalendarDays } from 'lucide-react';

export default function CashierTopbarTerminalMeta({ t, storeName, shiftOpenBadge, shift }) {
  if (!storeName && !shiftOpenBadge) return null;

  return (
    <div className="cashier-topbar__store-pill d-none d-md-inline-flex" title={storeName || undefined}>
      {storeName ? (
        <>
          <span className="cashier-topbar__store-dot" aria-hidden />
          <span className="cashier-topbar__store-name">{storeName}</span>
        </>
      ) : null}
      {storeName && shiftOpenBadge ? <span className="cashier-topbar__store-sep" aria-hidden /> : null}
      {shiftOpenBadge ? (
        <span
          className="cashier-topbar__shift-meta"
          title={shift?.id ? `${t('pos.shiftOpen')} · ${shift.id}` : undefined}
        >
          <CalendarDays size={14} strokeWidth={2} aria-hidden />
          <span>{shiftOpenBadge}</span>
        </span>
      ) : null}
    </div>
  );
}
