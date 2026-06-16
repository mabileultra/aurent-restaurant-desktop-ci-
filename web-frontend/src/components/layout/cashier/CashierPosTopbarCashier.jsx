import { UserRound } from 'lucide-react';

export default function CashierPosTopbarCashier({ name }) {
  if (!name) return null;

  return (
    <span className="cashier-pos-topbar__cashier d-none d-md-inline-flex" title={name}>
      <UserRound size={18} strokeWidth={2} aria-hidden />
      <span className="cashier-pos-topbar__cashier-name">{name}</span>
    </span>
  );
}
