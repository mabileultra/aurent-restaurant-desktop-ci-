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

  const shiftTitle = shift?.id ? `${t('pos.shiftOpen')} · ${shift.id}` : undefined;

  const shiftBlock = shiftOpenBadge ? (
    <span
      className={pharmacyBadge ? 'cashier-topbar__shift-chip' : 'cashier-topbar__shift-meta'}
      title={shiftTitle}
    >
      <CalendarDays size={14} strokeWidth={2} aria-hidden />
      <span>{shiftOpenBadge}</span>
    </span>
  ) : null;

  if (pharmacyBadge) {
    return (
      <>
        {displayName ? (
          <div
            className="cashier-topbar__store-pill cashier-topbar__store-pill--pharmacy d-none d-md-inline-flex"
            title={storeName || undefined}
          >
            <span className="cashier-topbar__store-dot" aria-hidden />
            <span className="cashier-topbar__store-name">{displayName}</span>
          </div>
        ) : null}
        {shiftBlock}
      </>
    );
  }

  return (
    <div
      className="cashier-topbar__store-pill d-none d-md-inline-flex"
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
        <span className="cashier-topbar__shift-meta" title={shiftTitle}>
          <CalendarDays size={14} strokeWidth={2} aria-hidden />
          <span>{shiftOpenBadge}</span>
        </span>
      ) : null}
    </div>
  );
}
