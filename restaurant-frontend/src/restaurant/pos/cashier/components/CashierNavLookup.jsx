import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { CASHIER_TAB_ICONS } from '../config/cashierNavIcons';
import { CASHIER_TABS } from '../utils/cashierNav';
import '../styles/cashier-nav-lookup.css';

export default function CashierNavLookup({ activeTab, onSelect, disabledKeys = [], t }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="rst-cashier-nav-lookup" ref={rootRef}>
      <button
        type="button"
        className={`rst-cashier-nav-lookup__toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('rst.cashier.navLabel')}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu size={22} strokeWidth={2.4} aria-hidden />
      </button>

      {open ? (
        <div className="rst-cashier-nav-lookup__panel" role="menu">
          {CASHIER_TABS.map((item) => {
            const Icon = CASHIER_TAB_ICONS[item.key];
            const active = activeTab === item.key || (item.key === 'hall' && !activeTab);
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`rst-cashier-nav-lookup__item${active ? ' is-active' : ''}`}
                disabled={disabledKeys.includes(item.key)}
                onClick={() => {
                  onSelect?.(item.key);
                  setOpen(false);
                }}
              >
                {Icon ? <Icon size={20} strokeWidth={2.2} aria-hidden /> : null}
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
