import { CalendarDays } from 'lucide-react';

export default function CashierTopbarTerminalMeta({
  t,
  storeName,
  shiftOpenBadge,
  shift,
  pharmacyBadge = false,
}) {
  if (!storeName && !shiftOpenBadge) return null;

  const displayName = pharmacyBadge && storeName
    ? t('pharmacyCashier.storeBadge', { name: storeName })
    : storeName;

  return (
    <div
      className={[
        'cashier-topbar__store-pill',
        'd-none',
        'd-md-inline-flex',
        pharmacyBadge ? 'cashier-topbar__store-pill--pharmacy' : '',
      ].filter(Boolean).join(' ')}
      title={storeName || undefined}
    >
      {displayName ? (
        <>
          <span className="cashier-topbar__store-dot" aria-hidden />
          <span className="cashier-topbar__store-name">{displayName}</span>
        </>
      ) : null}
      {displayName && shiftOpenBadge ? <span className="cashier-topbar__store-sep" aria-hidden /> : null}
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
