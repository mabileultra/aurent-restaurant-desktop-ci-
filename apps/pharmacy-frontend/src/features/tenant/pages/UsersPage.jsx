import React from 'react';
import { AlertCircle, Plus, RefreshCw, X } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../../platform/components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../../platform/utils/businessTypeFilterOptions';
import GeoFilterSelects from '../../shared/geo/GeoFilterSelects';
import StoresCompanyFilter from '../components/stores/StoresCompanyFilter';
import PlatformUserStatsCards from '../components/users/PlatformUserStatsCards';
import UserRoleFilter from '../components/users/UserRoleFilter';
import UserFormModal from '../components/users/UserFormModal';
import UserDeleteConfirmModal from '../components/users/UserDeleteConfirmModal';
import UsersTable from '../components/users/UsersTable';
import PlatformUserQuickDrawer from '../components/users/PlatformUserQuickDrawer';
import LastUpdatedBadge from '../../../components/shared/LastUpdatedBadge';
import { useUsersPage } from '../hooks/useUsersPage';
import { useAuthStore } from '../../../store/authStore';

export default function UsersPage({ mode = 'tenant' }) {
  const p = useUsersPage({ mode });
  const actorRole = useAuthStore((s) => s.user?.role);

  return (
    <PageLayout
      spacing="space-y-4"
      title={`${p.title}${typeof p.total === 'number' && p.total > 0 ? ` (${p.total})` : ''}`}
      subtitle={p.subtitle}
      actions={(
        <div className="flex items-center gap-3">
          <LastUpdatedBadge timestamp={p.dataUpdatedAt} className="hidden md:inline-flex" />
          <BaseButton requiresOnline onClick={p.openCreate} variant="primary">
            <Plus size={16} strokeWidth={1.75} />
            {p.t('users.add')}
          </BaseButton>
        </div>
      )}
    >
      {/* Network Error Card with Retry */}
      {p.isError && (
        <div className="ui-alert-danger items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} strokeWidth={1.75} className="shrink-0 text-danger-text" />
            <div>
              <p className="text-sm font-semibold">
                {p.t('users.loadErrorTitle', { defaultValue: 'Foydalanuvchilar ro‘yxatini yuklab bo‘lmadi' })}
              </p>
              <p className="mt-0.5 text-xs opacity-90">
                {p.error?.message || p.t('common.networkErrorHint', { defaultValue: 'Tarmoq yoki server bilan aloqani tekshiring' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => p.refetch()}
            className="ui-btn ui-btn-danger ui-btn-sm shrink-0"
          >
            <RefreshCw size={13} strokeWidth={1.75} />
            <span>{p.t('common.retry', { defaultValue: 'Qayta urinish' })}</span>
          </button>
        </div>
      )}

      {/* 1. Executive Summary KPI Cards (Platform view) */}
      {p.isPlatform && (
        <PlatformUserStatsCards
          t={p.t}
          totalUsers={p.totalUsers}
          activeUsers={p.activeUsers}
          inactiveUsers={p.inactiveUsers}
          adminUsers={p.adminUsers}
          staffUsers={p.staffUsers}
          statusFilter={p.statusFilter}
          roleFilter={p.roleFilter}
          onStatusFilterChange={p.handleStatusFilterChange}
          onRoleFilterChange={p.handleRoleFilterChange}
          isPending={p.isLoading}
          hasActiveFilters={p.hasContextFilters}
        />
      )}

      {/* 2. Status Segmented Tabs + Filters Toolbar */}
      <div className="space-y-3">
        {p.isPlatform && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="ui-tabs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => p.handleStatusFilterChange('ALL')}
                className={`ui-tab ${p.statusFilter === 'ALL' ? 'ui-tab-active' : ''}`}
              >
                {p.t('platform.tabAll', { defaultValue: 'Barchasi' })}
                <span className="ui-tabular rounded-full bg-canvas px-1.5 text-[11px] text-ink-muted">
                  {p.tabTotalUsers ?? p.totalUsers}
                </span>
              </button>
              <button
                type="button"
                onClick={() => p.handleStatusFilterChange('ACTIVE')}
                className={`ui-tab ${p.statusFilter === 'ACTIVE' ? 'ui-tab-active' : ''}`}
              >
                {p.t('platform.tabActive', { defaultValue: 'Faol' })}
                <span className="ui-tabular rounded-full bg-success-soft px-1.5 text-[11px] text-success-text">
                  {p.tabActiveUsers ?? p.activeUsers}
                </span>
              </button>
              <button
                type="button"
                onClick={() => p.handleStatusFilterChange('INACTIVE')}
                className={`ui-tab ${p.statusFilter === 'INACTIVE' ? 'ui-tab-active' : ''}`}
              >
                {p.t('platform.tabInactive', { defaultValue: 'Nofaol' })}
                <span className="ui-tabular rounded-full bg-warning-soft px-1.5 text-[11px] text-warning-text">
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
            <span className="text-ink-muted">{p.t('common.activeFilters', { defaultValue: 'Faol filtrlar' })}:</span>
            {p.search && (
              <span className="ui-badge-primary">
                <span>"{p.search}"</span>
                <button
                  type="button"
                  onClick={() => p.handleSearchChange('')}
                  className="hover:text-ink"
                  aria-label="Remove search filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {p.roleFilter && p.roleFilter !== 'ALL' && (
              <span className="ui-badge-info">
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
                  className="hover:text-ink"
                  aria-label="Remove role filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {p.statusFilter && p.statusFilter !== 'ALL' && (
              <span className="ui-badge-success">
                <span>{p.statusFilter === 'ACTIVE' ? p.t('platform.tabActive') : p.t('platform.tabInactive')}</span>
                <button
                  type="button"
                  onClick={() => p.handleStatusFilterChange('ALL')}
                  className="hover:text-ink"
                  aria-label="Remove status filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {p.businessType && (
              <span className="ui-badge-warning">
                <span>{p.t(`productTemplates.businessTypes.${p.businessType}`, p.businessType)}</span>
                <button
                  type="button"
                  onClick={() => p.handleBusinessTypeChange('')}
                  className="hover:text-ink"
                  aria-label="Remove business type filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {p.companyId && (
              <span className="ui-badge-neutral">
                <span>{p.companyById?.get?.(String(p.companyId))?.name || `#${p.companyId}`}</span>
                <button
                  type="button"
                  onClick={() => p.handleCompanyChange('')}
                  className="hover:text-ink"
                  aria-label="Remove company filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={p.handleResetFilters}
              className="ml-1 text-xs font-semibold text-primary-600 underline hover:text-primary-700"
            >
              {p.t('users.clearAllFilters', { defaultValue: 'Barchasini tozalash' })}
            </button>
          </div>
        )}
      </div>

      {/* 3. Table */}
      <UsersTable
        t={p.t}
        isPlatform={p.isPlatform}
        isLoading={p.isLoading}
        isRefreshing={p.isRefreshing}
        showOverlay={p.showRefreshingOverlay}
        pageRows={p.pageRows}
        page={p.page}
        displayPage={p.displayPage}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onToggleActive={p.toggleUser}
        onDelete={p.openDelete}
        actorRole={actorRole}
        companyById={p.companyById}
        onRowClick={p.openDrawer}
        sortField={p.sortField}
        sortDirection={p.sortDirection}
        onSort={p.handleSort}
        selectedUserIds={p.selectedUserIds}
        onToggleSelectAll={p.handleToggleSelectAll}
        onToggleSelectUser={p.handleToggleSelectUser}
        onClearSelection={p.handleClearSelection}
        onBulkToggleActive={p.handleBulkToggleActive}
        onExportSelectedCsv={p.handleExportSelectedCsv}
        onSelectAllMatching={p.handleSelectAllMatching}
        isAllMatchingSelected={p.isAllMatchingSelected}
        totalMatching={p.pageRows.length}
        hasInactiveSelected={p.hasInactiveSelected}
        hasActiveSelected={p.hasActiveSelected}
      />

      {/* 4. Modals and Quick Drawer */}
      <PlatformUserQuickDrawer
        open={Boolean(p.drawerUser)}
        user={p.drawerUser}
        onClose={p.closeDrawer}
        onEdit={p.openEdit}
        onToggleActive={p.toggleUser}
        onDelete={p.openDelete}
        actorRole={actorRole}
        t={p.t}
      />

      <UserDeleteConfirmModal
        user={p.deleteTarget}
        t={p.t}
        isPending={p.isDeletePending}
        onClose={p.closeDelete}
        onConfirm={p.confirmDelete}
      />

      <UserFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        isPlatform={p.isPlatform}
        mode={p.modalMode}
        editingUser={p.editingUser}
        businessTypeFilter={p.isPlatform ? p.businessType : ''}
      />
    </PageLayout>
  );
}
