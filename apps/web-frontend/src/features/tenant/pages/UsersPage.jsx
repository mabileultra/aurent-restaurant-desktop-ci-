import React from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformUserStatsCards from '../components/users/PlatformUserStatsCards';
import UsersFilterToolbar from '../components/users/UsersFilterToolbar';
import UserFormModal from '../components/users/UserFormModal';
import UserDeleteConfirmModal from '../components/users/UserDeleteConfirmModal';
import PlatformUserToggleActiveModal from '../components/users/PlatformUserToggleActiveModal';
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
          <BaseButton requiresOnline onClick={p.openCreate} className="admin-btn-primary">
            <Plus size={16} />
            {p.t('users.add')}
          </BaseButton>
        </div>
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
      <UsersFilterToolbar p={p} />

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
        onToggleActive={p.openToggleActive}
        onDelete={p.openDelete}
        actorRole={actorRole}
        currentUserId={p.currentUserId}
        currentUsername={p.currentUsername}
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
        currentUserId={p.currentUserId}
        currentUsername={p.currentUsername}
        onClose={p.closeDrawer}
        onEdit={p.openEdit}
        onToggleActive={p.openToggleActive}
        onDelete={p.openDelete}
        actorRole={actorRole}
        t={p.t}
      />

      <PlatformUserToggleActiveModal
        user={p.toggleTarget}
        currentUserId={p.currentUserId}
        currentUsername={p.currentUsername}
        t={p.t}
        isPending={p.isTogglePending}
        onClose={p.closeToggleActive}
        onConfirm={p.confirmToggleActive}
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
        resetPasswordMode={p.editingUser?.resetPasswordMode}
        businessTypeFilter={p.isPlatform ? p.businessType : ''}
      />
    </PageLayout>
  );
}
