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
        <BaseButton onClick={p.openCreate} className="admin-btn-primary">
          <Plus size={16} />
          {p.t('users.add')}
        </BaseButton>
      )}
    >
      {/* Network Error Card with Retry */}
      {p.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {p.t('users.loadErrorTitle', { defaultValue: 'Foydalanuvchilar ro‘yxatini yuklab bo‘lmadi' })}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {p.error?.message || p.t('common.networkErrorHint', { defaultValue: 'Tarmoq yoki server bilan aloqani tekshiring' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => p.refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-200 text-xs font-semibold transition-colors shrink-0"
          >
            <RefreshCw size={13} />
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
