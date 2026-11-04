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
    <div className="bc-card bc-calendar-toolbar">
      {/* Top row: Month navigation & View Switcher */}
      <div className="bc-calendar-toolbar__top">
        <div className="bc-cal-month-nav">
          <button
            type="button"
            className="bc-icon-btn bc-icon-btn--circle"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label={t('platform.billing.calendarPrev', { defaultValue: 'Oldingi oy' })}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>

          <h3 className="bc-cal-month-nav__title">{monthTitle}</h3>

          <button
            type="button"
            className="bc-icon-btn bc-icon-btn--circle"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label={t('platform.billing.calendarNext', { defaultValue: 'Keyingi oy' })}
          >
            <ChevronRight size={18} aria-hidden />
          </button>

          <button
            type="button"
            className={`bc-btn bc-btn--sm ${month === todayKey ? 'bc-btn--outline' : 'bc-btn--primary'}`}
            onClick={onToday}
          >
            {k('today', { defaultValue: 'Bugun' })}
          </button>
        </div>

        {/* View Mode Switcher (Kalendar / Ro'yxat) */}
        <div className="bc-cal-view-modes">
          <button
            type="button"
            className={`bc-cal-view-mode-btn ${viewMode === 'calendar' ? 'is-active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={15} aria-hidden />
            <span>{k('calendarView', { defaultValue: 'Kalendar' })}</span>
          </button>
          <button
            type="button"
            className={`bc-cal-view-mode-btn ${viewMode === 'list' ? 'is-active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={15} aria-hidden />
            <span>{k('listView', { defaultValue: 'Ro‘yxat' })}</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Controls */}
      <div className="bc-calendar-toolbar__filters">
        {/* Status Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label">{k('filterStatus', { defaultValue: 'Holati' })}</label>
          <PlatformSelect
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            searchable={false}
          />
        </div>

        {/* Plan Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label">{k('filterPlan', { defaultValue: 'Tarif' })}</label>
          <PlatformSelect
            size="sm"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            options={planOptions}
            searchable={false}
          />
        </div>

        {/* Region Filter */}
        <div className="bc-cal-filter-col">
          <label className="bc-cal-filter-label">{k('filterRegion', { defaultValue: 'Hudud' })}</label>
          <PlatformSelect
            size="sm"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={regionOptions}
            searchable={true}
          />
        </div>

        {/* Search Input */}
        <div className="bc-cal-filter-col bc-cal-filter-col--search">
          <label className="bc-cal-filter-label">{t('common.search', { defaultValue: 'Qidiruv' })}</label>
          <div className="bc-cal-search-wrap">
            <Search size={14} className="bc-cal-search-icon" aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={k('searchPlaceholder', { defaultValue: 'Kompaniya, STIR, telefon…' })}
              className="bc-cal-search-input"
            />
          </div>
        </div>

        {/* Reset Filters button */}
        {hasFilters && onResetFilters ? (
          <div className="bc-cal-filter-col bc-cal-filter-col--reset flex items-end">
            <button
              type="button"
              className="bc-btn bc-btn--ghost bc-btn--sm h-[2rem] gap-1.5 px-3 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              onClick={onResetFilters}
              title={t('platform.billing.collections.resetFilters', { defaultValue: 'Filtrlarni tozalash' })}
            >
              <RotateCcw size={13} aria-hidden />
              <span>{t('common.reset', { defaultValue: 'Tozalash' })}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
