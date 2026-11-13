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
          <div className="aa-size-seg flex items-center rounded-aa-md bg-aa-surface-sunken border border-aa-line font-semibold w-full sm:w-auto overflow-x-auto overflow-y-hidden shadow-none">
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('ALL')}
              className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-aa-sm transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
                p.statusFilter === 'ALL'
                  ? 'bg-aa-surface text-aa-ink shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-ink'
              }`}
            >
              <span>{p.t('platform.tabAll', { defaultValue: 'Barchasi' })}</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
                {p.tabTotalUsers ?? p.totalUsers}
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('ACTIVE')}
              className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-aa-sm transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
                p.statusFilter === 'ACTIVE'
                  ? 'bg-aa-surface text-aa-ink shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-ink'
              }`}
            >
              <span>{p.t('platform.tabActive', { defaultValue: 'Faol' })}</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
                {p.tabActiveUsers ?? p.activeUsers}
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.handleStatusFilterChange('INACTIVE')}
              className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-aa-sm transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
                p.statusFilter === 'INACTIVE'
                  ? 'bg-aa-surface text-aa-ink shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-ink'
              }`}
            >
              <span>{p.t('platform.tabInactive', { defaultValue: 'Nofaol' })}</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
                {p.tabInactiveUsers ?? p.inactiveUsers}
              </span>
            </button>
          </div>
        </div>
      )}

      <PlatformCompactFilterBar
        className="platform-filter-bar--aa"
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
              variant="aa"
              size="md"
              role={p.roleFilter === 'ALL' ? '' : p.roleFilter}
              onChange={p.handleRoleFilterChange}
            />
            <GeoFilterSelects
              variant="aa"
              size="md"
              regionCode={p.regionCode}
              districtCode={p.districtCode}
              onChange={p.handleGeoChange}
            />
            {p.isPlatform ? (
              <StoresCompanyFilter
                variant="aa"
                size="md"
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
          <span className="text-aa-ink-muted">{p.t('common.activeFilters', { defaultValue: 'Faol filtrlar' })}:</span>
          {p.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line">
              <span>"{p.search}"</span>
              <button
                type="button"
                onClick={() => p.handleSearchChange('')}
                className="text-aa-ink-muted hover:text-aa-ink cursor-pointer"
                aria-label="Remove search filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.roleFilter && p.roleFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line">
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
                className="text-aa-ink-muted hover:text-aa-ink cursor-pointer"
                aria-label="Remove role filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.statusFilter && p.statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line">
              <span>{p.statusFilter === 'ACTIVE' ? p.t('platform.tabActive') : p.t('platform.tabInactive')}</span>
              <button
                type="button"
                onClick={() => p.handleStatusFilterChange('ALL')}
                className="text-aa-ink-muted hover:text-aa-ink cursor-pointer"
                aria-label="Remove status filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.businessType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line">
              <span>{p.t(`productTemplates.businessTypes.${p.businessType}`, p.businessType)}</span>
              <button
                type="button"
                onClick={() => p.handleBusinessTypeChange('')}
                className="text-aa-ink-muted hover:text-aa-ink cursor-pointer"
                aria-label="Remove business type filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {p.companyId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line">
              <span>{p.companyById?.get?.(String(p.companyId))?.name || `#${p.companyId}`}</span>
              <button
                type="button"
                onClick={() => p.handleCompanyChange('')}
                className="text-aa-ink-muted hover:text-aa-ink cursor-pointer"
                aria-label="Remove company filter"
              >
                <X size={13} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={p.handleResetFilters}
            className="text-xs font-semibold text-aa-brand hover:underline ml-1 cursor-pointer"
          >
            {p.t('users.clearAllFilters', { defaultValue: 'Barchasini tozalash' })}
          </button>
        </div>
      )}
    </div>
  );
}
