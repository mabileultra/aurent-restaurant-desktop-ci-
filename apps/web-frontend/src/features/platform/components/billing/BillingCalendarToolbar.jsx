import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, List, RotateCcw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PlatformSelect from '../PlatformSelect';
import { geoApi } from '../../../../api/geo.api';
import { cleanGeoName } from '../../../shared/geo/geoNameUtils';
import { formatMonthTitle, monthKey, shiftMonth } from './billingCalendarUtils';

export default function BillingCalendarToolbar({
  t,
  month,
  setMonth,
  onToday,
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  regionFilter,
  setRegionFilter,
  search,
  setSearch,
  hasFilters = false,
  onResetFilters,
  plans = [],
  lang,
}) {
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);
  const todayKey = monthKey(new Date());

  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data || []),
    staleTime: 600_000,
  });

  const monthTitle = formatMonthTitle(month, lang);

  const STATUS_OPTIONS = [
    { value: 'ALL', label: t('common.all', { defaultValue: 'Barcha holatlar' }) },
    { value: 'ACTIVE', label: t('platform.billing.collections.states.ACTIVE', { defaultValue: 'Muvaffaqiyatli' }) },
    { value: 'PLANNED', label: k('legendPlanned', { defaultValue: 'Rejalashtirilgan' }) },
    { value: 'DEFERRAL', label: k('legendDeferral', { defaultValue: 'Kechiktirilgan' }) },
    { value: 'LOW_BALANCE', label: k('legendLowBalance', { defaultValue: 'Balans yetmaydi' }) },
    { value: 'SUSPENDED', label: t('platform.billing.collections.states.SUSPENDED', { defaultValue: 'To‘xtatilgan' }) },
  ];

  const planOptions = [
    { value: 'ALL', label: t('platform.billing.collections.allPlans', { defaultValue: 'Barcha tariflar' }) },
    ...plans.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const regionOptions = [
    { value: 'ALL', label: t('geo.allRegions', { defaultValue: 'Barcha hududlar' }) },
    ...regions.map((r) => {
      const name = lang?.startsWith('uz') ? (r.nameUz || r.nameRu) : (r.nameRu || r.nameUz);
      const code = r.code || r.regionCode;
      return { value: code, label: cleanGeoName(name) };
    }),
  ];

  return (
    <div className="platform-filter-bar platform-filter-bar--aa bc-card bc-calendar-toolbar bg-aa-surface border border-aa-line rounded-aa-lg p-3.5 sm:p-4 shadow-none">
      {/* Top row: Month navigation & View Switcher */}
      <div className="bc-calendar-toolbar__top flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-aa-line">
        <div className="bc-cal-month-nav flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-aa-sm border border-aa-line bg-aa-surface text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label={t('platform.billing.calendarPrev', { defaultValue: 'Oldingi oy' })}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>

          <h3 className="bc-cal-month-nav__title text-sm font-semibold text-aa-ink px-1 min-w-[120px] text-center">{monthTitle}</h3>

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-aa-sm border border-aa-line bg-aa-surface text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label={t('platform.billing.calendarNext', { defaultValue: 'Keyingi oy' })}
          >
            <ChevronRight size={16} aria-hidden />
          </button>

          <button
            type="button"
            className={`aa-btn aa-btn--secondary aa-size-sm inline-flex items-center cursor-pointer ${month === todayKey ? 'opacity-80' : ''}`}
            onClick={onToday}
          >
            {k('today', { defaultValue: 'Bugun' })}
          </button>
        </div>

        {/* View Mode Switcher (Kalendar / Ro'yxat) */}
        <div className="aa-seg bc-cal-view-modes inline-flex items-center p-0.5 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
          <button
            type="button"
            className={`aa-seg-btn aa-size-seg-btn px-3 py-1 text-xs font-semibold rounded-aa-sm transition-all inline-flex items-center gap-1.5 cursor-pointer ${viewMode === 'calendar' ? 'bg-aa-surface text-aa-ink shadow-sm' : 'text-aa-ink-muted hover:text-aa-ink'}`}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={14} aria-hidden />
            <span>{k('calendarView', { defaultValue: 'Kalendar' })}</span>
          </button>
          <button
            type="button"
            className={`aa-seg-btn aa-size-seg-btn px-3 py-1 text-xs font-semibold rounded-aa-sm transition-all inline-flex items-center gap-1.5 cursor-pointer ${viewMode === 'list' ? 'bg-aa-surface text-aa-ink shadow-sm' : 'text-aa-ink-muted hover:text-aa-ink'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={14} aria-hidden />
            <span>{k('listView', { defaultValue: 'Ro‘yxat' })}</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Controls */}
      <div className="bc-calendar-toolbar__filters grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
        {/* Status Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label block text-xs font-semibold text-aa-ink-muted mb-1">{k('filterStatus', { defaultValue: 'Holati' })}</label>
          <PlatformSelect
            variant="aa"
            size="md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            searchable={false}
          />
        </div>

        {/* Plan Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label block text-xs font-semibold text-aa-ink-muted mb-1">{k('filterPlan', { defaultValue: 'Tarif' })}</label>
          <PlatformSelect
            variant="aa"
            size="md"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            options={planOptions}
            searchable={false}
          />
        </div>

        {/* Region Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label block text-xs font-semibold text-aa-ink-muted mb-1">{k('filterRegion', { defaultValue: 'Hudud' })}</label>
          <PlatformSelect
            variant="aa"
            size="md"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={regionOptions}
            searchable={true}
          />
        </div>

        {/* Search Input */}
        <div className="bc-cal-filter-col bc-cal-filter-col--search">
          <label className="bc-cal-filter-label block text-xs font-semibold text-aa-ink-muted mb-1">{t('common.search', { defaultValue: 'Qidiruv' })}</label>
          <div className="bc-cal-search-wrap flex items-center h-10 px-3 rounded-aa-md border border-aa-line-strong bg-aa-surface focus-within:border-aa-brand focus-within:ring-1 focus-within:ring-aa-brand transition-all">
            <Search size={14} className="bc-cal-search-icon text-aa-ink-muted shrink-0 mr-2" aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={k('searchPlaceholder', { defaultValue: 'Kompaniya, STIR, telefon…' })}
              className="bc-cal-search-input bg-transparent border-0 outline-none p-0 text-sm text-aa-ink placeholder:text-aa-ink-muted w-full focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Reset Filters button */}
        {hasFilters && onResetFilters ? (
          <div className="bc-cal-filter-col bc-cal-filter-col--reset flex items-end">
            <button
              type="button"
              className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center gap-1.5 cursor-pointer"
              onClick={onResetFilters}
              title={t('platform.billing.collections.resetFilters', { defaultValue: 'Filtrlarni tozalash' })}
            >
              <RotateCcw size={14} aria-hidden />
              <span>{t('common.reset', { defaultValue: 'Tozalash' })}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
