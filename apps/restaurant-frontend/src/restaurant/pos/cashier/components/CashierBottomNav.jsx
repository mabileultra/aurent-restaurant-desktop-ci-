import { CASHIER_TAB_ICONS } from '../config/cashierNavIcons';
import { CASHIER_MOBILE_TABS } from '../utils/cashierNav';
import '../styles/cashier-bottom-nav.css';

export default function CashierBottomNav({ tab, onSelect, t }) {
  return (
    <nav className="rst-cashier-nav" aria-label={t('rst.cashier.navLabel')}>
      {CASHIER_MOBILE_TABS.map((item) => {
        const Icon = CASHIER_TAB_ICONS[item.key];
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`rst-cashier-nav__btn${active ? ' is-active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            {Icon ? <Icon size={18} strokeWidth={2.2} aria-hidden /> : null}
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
