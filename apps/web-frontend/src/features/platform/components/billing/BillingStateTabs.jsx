import { AlertCircle, Ban, CheckCircle2, Clock, LayoutGrid, UserPlus } from 'lucide-react';
import { COLLECTION_TABS } from '../../hooks/useBillingCollections';

const ICONS = {
  ALL: LayoutGrid,
  OVERDUE: AlertCircle,
  DUE_SOON: Clock,
  ACTIVE: CheckCircle2,
  NEW: UserPlus,
  SUSPENDED: Ban,
};

export default function BillingStateTabs({ t, tab, onTab, count }) {
  return (
    <div className="bc-tabs" role="tablist">
      {COLLECTION_TABS.map((key) => {
        const Icon = ICONS[key];
        const n = count(key);
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`bc-tab bc-tab--${key}${tab === key ? ' bc-tab--active' : ''}`}
            onClick={() => onTab(key)}
          >
            <Icon size={16} strokeWidth={2.2} aria-hidden />
            {t(`platform.billing.collections.tabs.${key}`)}
            {n != null ? <span className="bc-tab__count">({n})</span> : null}
          </button>
        );
      })}
    </div>
  );
}
