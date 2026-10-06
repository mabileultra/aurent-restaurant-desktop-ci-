import { RotateCcw, Search } from 'lucide-react';
import { DATE_FIELDS, PAYMENT_METHODS } from '../../hooks/useBillingCollections';

export default function BillingFiltersBar({ t, c, plans }) {
  const k = (key) => t(`platform.billing.collections.${key}`);
  const hasFilters = c.planId || c.method || c.from || c.to || c.search;
  return (
    <div className="bc-filters">
      <div className="bc-filters__date">
        <select
          className="bc-control"
          value={c.dateField}
          onChange={(e) => c.setDateField(e.target.value)}
          aria-label={k('dateFieldLabel')}
        >
          {DATE_FIELDS.map((f) => <option key={f} value={f}>{k(`dateFields.${f}`)}</option>)}
        </select>
        <input
          type="date"
          className="bc-control"
          value={c.from}
          max={c.to || undefined}
          onChange={(e) => c.setFrom(e.target.value)}
          aria-label={k('dateFrom')}
        />
        <span className="bc-filters__dash">—</span>
        <input
          type="date"
          className="bc-control"
          value={c.to}
          min={c.from || undefined}
          onChange={(e) => c.setTo(e.target.value)}
          aria-label={k('dateTo')}
        />
      </div>
      <select className="bc-control" value={c.planId} onChange={(e) => c.setPlanId(e.target.value)}>
        <option value="">{k('allPlans')}</option>
        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
      </select>
      <select className="bc-control" value={c.method} onChange={(e) => c.setMethod(e.target.value)}>
        <option value="">{k('allMethods')}</option>
        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{k(`methods.${m}`)}</option>)}
      </select>
      <label className="bc-filters__search">
        <Search size={16} strokeWidth={2.2} aria-hidden />
        <input
          value={c.search}
          onChange={(e) => c.setSearch(e.target.value)}
          placeholder={k('searchPlaceholder')}
        />
      </label>
      {hasFilters ? (
        <button type="button" className="bc-btn bc-btn--ghost" onClick={c.resetFilters}>
          <RotateCcw size={15} aria-hidden />
          {k('resetFilters')}
        </button>
      ) : null}
    </div>
  );
}
