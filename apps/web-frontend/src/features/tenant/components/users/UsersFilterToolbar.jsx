import React from 'react';
import { X } from 'lucide-react';
import PlatformCompactFilterBar from '../../../platform/components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../../../platform/utils/businessTypeFilterOptions';
import GeoFilterSelects from '../../../shared/geo/GeoFilterSelects';
import StoresCompanyFilter from '../stores/StoresCompanyFilter';
import UserRoleFilter from './UserRoleFilter';

/**
 * UsersFilterToolbar
 * Renders status tabs (ALL, ACTIVE, INACTIVE), search, filters and active filter chips for UsersPage.
 */
export default function UsersFilterToolbar({ p }) {
  return (
    <div className="space-y-3">
      {p.isPlatform && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                p.statusFilter === 'ALL'
                  ? 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.t('platform.tabAll', { defaultValue: 'Barchasi' })}
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {p.tabTotalUsers ?? p.totalUsers}
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                p.statusFilter === 'ACTIVE'
                  ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              {p.t('platform.tabActive', { defaultValue: 'Faol' })}
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                {p.tabActiveUsers ?? p.activeUsers}
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                p.statusFilter === 'INACTIVE'
                  ? 'bg-white dark:!bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              {p.t('platform.tabInactive', { defaultValue: 'Nofaol' })}
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
                {p.tabInactiveUsers ?? p.inactiveUsers}
              </span>
            </button>
          </div>
        </div>
      )}

      <PlatformCompactFilterBar
        search={p.search}
        onSearchChange={p.handleSearchChange}
        searchPlaceholder={p.t('platform.userSearch', { defaultValue: 'Ism, login, telefon bo‘yicha qidirish…' })}
        filterLabel={p.isPlatform ? p.t('platform.filterBusinessType') : undefined}
        filterOptions={p.isPlatform ? buildBusinessTypeFilterOptions(p.t, p.businessTypes) : undefined}
        filterValue={p.businessType}
        onFilterChange={p.handleBusinessTypeChange}
        onReset={p.handleResetFilters}
        resetLabel={p.t('common.reset', { defaultValue: 'Tozalash' })}
        extra={(
          <>
            <UserRoleFilter
              t={p.t}
              role={p.roleFilter === 'ALL' ? '' : p.roleFilter}
              onChange={p.handleRoleFilterChange}
            />
            <GeoFilterSelects
              regionCode={p.regionCode}
              districtCode={p.districtCode}
              onChange={p.handleGeoChange}
            />
            {p.isPlatform ? (
              <StoresCompanyFilter
                t={p.t}
                companies={p.companies}
                companyId={p.companyId}
                onChange={p.handleCompanyChange}
              />
            ) : null}
          </>
        )}
      />

      {/* Active Filter Chips */}
      {p.hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400">{p.t('common.activeFilters', { defaultValue: 'Faol filtrlar' })}:</span>
          {p.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
              <span>"{p.search}"</span>
              <button
                type="button"
                onClick={() => p.handleSearchChange('')}
                className="hover:text-purple-900 dark:hover:text-white"
                aria-label="Remove search filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.roleFilter && p.roleFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
              <span>
                {p.roleFilter === 'MANAGEMENT'
                  ? p.t('users.filterManagement', { defaultValue: 'Administrator va menejerlar' })
                  : p.roleFilter === 'STAFF'
                    ? p.t('users.filterStaff', { defaultValue: 'Xizmat ko‘rsatish xodimlari' })
                    : p.t(`roles.${p.roleFilter}`, p.roleFilter)}
              </span>
              <button
                type="button"
                onClick={() => p.handleRoleFilterChange('ALL')}
                className="hover:text-blue-900 dark:hover:text-white"
                aria-label="Remove role filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.statusFilter && p.statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span>{p.statusFilter === 'ACTIVE' ? p.t('platform.tabActive') : p.t('platform.tabInactive')}</span>
              <button
                type="button"
                onClick={() => p.handleStatusFilterChange('ALL')}
                className="hover:text-emerald-900 dark:hover:text-white"
                aria-label="Remove status filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.businessType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
              <span>{p.t(`productTemplates.businessTypes.${p.businessType}`, p.businessType)}</span>
              <button
                type="button"
                onClick={() => p.handleBusinessTypeChange('')}
                className="hover:text-amber-900 dark:hover:text-white"
                aria-label="Remove business type filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.companyId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>{p.companyById?.get?.(String(p.companyId))?.name || `#${p.companyId}`}</span>
              <button
                type="button"
                onClick={() => p.handleCompanyChange('')}
                className="hover:text-slate-900 dark:hover:text-white"
                aria-label="Remove company filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={p.handleResetFilters}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline ml-1"
          >
            {p.t('users.clearAllFilters', { defaultValue: 'Barchasini tozalash' })}
          </button>
        </div>
      )}
    </div>
  );
}
