import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';

/**
 * Кнопка-триггер меню навигации кассы ресторана.
 */
export default function CashierNavTriggerButton({
  open,
  setOpen,
  hasBadge,
  badgeUrgent,
  showBusy,
  downloading,
  downloadPercent,
  updateState,
  toggleLabel,
}) {
  return (
    <button
      type="button"
      className={[
        'rst-cashier-nav-lookup__toggle',
        open ? 'is-open' : '',
        hasBadge ? 'has-update' : '',
        badgeUrgent ? 'has-update-urgent' : '',
        showBusy ? 'is-busy' : '',
        downloading ? 'is-downloading' : '',
      ].filter(Boolean).join(' ')}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={toggleLabel}
      aria-busy={showBusy || undefined}
      onClick={() => setOpen((prev) => !prev)}
    >
      {showBusy ? (
        <RefreshCw size={22} strokeWidth={2.4} className="rst-cashier-nav-lookup__spin" aria-hidden />
      ) : (
        <Menu size={22} strokeWidth={2.4} aria-hidden />
      )}
      {downloading ? (
        <span className="rst-cashier-nav-lookup__pct" aria-live="polite">
          {updateState === 'progress' ? `${downloadPercent}%` : '…'}
        </span>
      ) : hasBadge ? (
        <span className="rst-cashier-nav-lookup__badge" aria-hidden />
      ) : null}
    </button>
  );
}
