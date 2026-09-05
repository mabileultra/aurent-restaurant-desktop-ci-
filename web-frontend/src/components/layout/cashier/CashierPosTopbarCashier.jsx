function initialsFromName(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0] ?? '?').slice(0, 2).toUpperCase();
}

export default function CashierPosTopbarCashier({ name, roleLabel }) {
  if (!name) return null;

  return (
    <div className="cashier-pos-topbar__cashier d-none d-md-inline-flex" title={name}>
      <span className="cashier-pos-topbar__avatar" aria-hidden>
        {initialsFromName(name)}
      </span>
      <span className="cashier-pos-topbar__cashier-text">
        <span className="cashier-pos-topbar__cashier-name">{name}</span>
        {roleLabel ? (
          <span className="cashier-pos-topbar__cashier-role">
            <span className="cashier-pos-topbar__role-dot" aria-hidden />
            {roleLabel}
          </span>
        ) : null}
      </span>
    </div>
  );
}
