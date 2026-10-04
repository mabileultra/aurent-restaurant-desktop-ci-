import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, X } from 'lucide-react';
import { CASHIER_TAB_ICONS } from '../../cashier/config/cashierNavIcons';
import { CASHIER_MOBILE_TABS } from '../../cashier/utils/cashierNav';
import '../styles/cashier-mobile-nav.css';

/**
 * Collapsible cashier phone nav — collapsed pill, open sheet with sections.
 */
export default function CashierMobileNavSheet({
  tab,
  onSelect,
  disabledKeys = [],
  t,
}) {
  const [open, setOpen] = useState(false);
  const active = CASHIER_MOBILE_TABS.find((item) => item.key === tab) || CASHIER_MOBILE_TABS[0];
  const ActiveIcon = CASHIER_TAB_ICONS[active.key];

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pick = (key) => {
    setOpen(false);
    onSelect?.(key);
  };

  const sheet = open && typeof document !== 'undefined' ? createPortal(
    <div className="rst-cashier-more" role="dialog" aria-modal="true" aria-labelledby="rst-cashier-more-title">
      <button
        type="button"
        className="rst-cashier-more__backdrop"
        aria-label={t('common.close')}
        onClick={() => setOpen(false)}
      />
      <div className="rst-cashier-more__sheet">
        <div className="rst-cashier-more__grab" aria-hidden />
        <header className="rst-cashier-more__head">
          <h2 id="rst-cashier-more-title">{t('rst.cashier.navLabel')}</h2>
          <button
            type="button"
            className="rst-cashier-more__close"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="rst-cashier-more__grid" role="list">
          {CASHIER_MOBILE_TABS.map((item) => {
            const Icon = CASHIER_TAB_ICONS[item.key];
            const disabled = disabledKeys.includes(item.key);
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="listitem"
                disabled={disabled}
                className={`rst-cashier-more__item${isActive ? ' is-active' : ''}`}
                onClick={() => pick(item.key)}
              >
                {Icon ? <Icon size={20} strokeWidth={2.2} aria-hidden /> : null}
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div className="rst-cashier-more-bar">
        <button
          type="button"
          className="rst-cashier-more-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {ActiveIcon ? <ActiveIcon size={18} strokeWidth={2.2} aria-hidden /> : null}
          <span>{t(active.labelKey)}</span>
          <ChevronUp size={16} aria-hidden />
        </button>
      </div>
      {sheet}
    </>
  );
}
