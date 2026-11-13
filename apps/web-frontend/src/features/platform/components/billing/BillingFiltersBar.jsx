import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import clsx from 'clsx';
import { BaseSelect } from '../../../../components/ui';
import GeoFilterSelects from '../../../shared/geo/GeoFilterSelects';
import { DATE_FIELDS, PAYMENT_METHODS } from '../../hooks/useBillingCollections';
import PlatformDateRangePicker from '../PlatformDateRangePicker';

export default function BillingFiltersBar({ t, c, plans }) {
  const k = (key) => t(`platform.billing.collections.${key}`);
  const hasFilters = c.planId || c.method || c.from || c.to || c.search || c.regionCode || c.districtCode;

  const dateFieldOptions = DATE_FIELDS.map((f) => ({
    value: f,
    label: k(`dateFields.${f}`),
  }));

  const planOptions = [
    { value: '', label: k('allPlans') },
    ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
  ];

  const methodOptions = [
    { value: '', label: k('allMethods') },
    ...PAYMENT_METHODS.map((m) => ({ value: m, label: k(`methods.${m}`) })),
  ];

  return (
    <div className="bc-filters">
      {/* 1-qator: Qidiruv + Sana oralig'i + Tozalash */}
      <div className="bc-filters__row bc-filters__row--primary">
        <label className="bc-filters__search flex items-center h-10 sm:h-10 h-11 px-3 rounded-aa-md border border-aa-line-strong bg-aa-surface focus-within:border-aa-brand focus-within:ring-1 focus-within:ring-aa-brand transition-all flex-1 min-w-[200px]">
          <Search size={16} className="text-aa-ink-muted shrink-0 mr-2" aria-hidden />
          <input
            value={c.search}
            onChange={(e) => c.setSearch(e.target.value)}
            placeholder={k('searchPlaceholder')}
            className="bg-transparent border-0 outline-none p-0 text-sm text-aa-ink placeholder:text-aa-ink-muted w-full focus:ring-0 focus:outline-none"
          />
        </label>

        <div className="bc-filters__date flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <BaseSelect
            variant="aa"
            size="md"
            searchable={false}
            className={clsx('bc-filter-select bc-filter-select--date-type w-auto min-w-[170px]', c.dateField && 'base-select--active-filter')}
            value={c.dateField}
            onChange={(e) => c.setDateField(e.target.value)}
            aria-label={k('dateFieldLabel')}
            options={dateFieldOptions}
          />
          <PlatformDateRangePicker
            variant="aa"
            from={c.from}
            to={c.to}
            onChange={({ from, to }) => {
              c.setFrom(from);
              c.setTo(to);
            }}
            align="right"
            t={t}
          />
        </div>

        {hasFilters ? (
          <button
            type="button"
            className="aa-btn aa-btn--secondary aa-size-md bc-filters__reset inline-flex items-center gap-1.5 cursor-pointer"
            onClick={c.resetFilters}
            title={k('resetFilters')}
          >
            <RotateCcw size={15} aria-hidden />
            <span>{k('resetFilters')}</span>
          </button>
        ) : null}
      </div>

      {/* 2-qator: Viloyat, Tuman, Tarif va To'lov usuli filtrlari */}
      <div className="bc-filters__row bc-filters__row--secondary">
        <GeoFilterSelects
          variant="aa"
          className="bc-filters__geo"
          selectClassName="bc-filter-select"
          regionCode={c.regionCode}
          districtCode={c.districtCode}
          onChange={c.setGeo}
        />

        <BaseSelect
          variant="aa"
          size="md"
          searchable={plans.length > 5}
          className={clsx('bc-filter-select', c.planId && 'base-select--active-filter')}
          value={c.planId}
          placeholder={k('allPlans')}
          onChange={(e) => c.setPlanId(e.target.value)}
          options={planOptions}
        />

        <BaseSelect
          variant="aa"
          size="md"
          searchable={false}
          className={clsx('bc-filter-select', c.method && 'base-select--active-filter')}
          value={c.method}
          placeholder={k('allMethods')}
          onChange={(e) => c.setMethod(e.target.value)}
          options={methodOptions}
        />
      </div>
    </div>
  );
}

