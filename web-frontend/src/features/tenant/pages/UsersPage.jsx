import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PageSearchField } from '../../../components/ui';
import PlatformCompactFilterBar from '../../platform/components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../../platform/utils/businessTypeFilterOptions';
import UserFormModal from '../components/users/UserFormModal';
import UserDeleteConfirmModal from '../components/users/UserDeleteConfirmModal';
import UsersTable from '../components/users/UsersTable';
import { useUsersPage } from '../hooks/useUsersPage';
import { useAuthStore } from '../../../store/authStore';

export default function UsersPage({ mode = 'tenant' }) {
  const p = useUsersPage({ mode });
  const actorRole = useAuthStore((s) => s.user?.role);

  return (
    <PageLayout
      title={p.title}
      subtitle={p.subtitle}
      actions={(
        <BaseButton onClick={p.openCreate}>
          <Plus size={16} />
          {p.t('users.add')}
        </BaseButton>
      )}
      filters={p.isPlatform ? (
        <PlatformCompactFilterBar
          search={p.search}
          onSearchChange={p.handleSearchChange}
          searchPlaceholder={p.t('platform.userSearch')}
          filterLabel={p.t('platform.filterBusinessType')}
          filterOptions={buildBusinessTypeFilterOptions(p.t, p.businessTypes)}
          filterValue={p.businessType}
          onFilterChange={p.handleBusinessTypeChange}
        />
      ) : (
        <PageSearchField
          className="max-w-md"
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('platform.userSearch')}
        />
      )}
    >
      <UsersTable
        t={p.t}
        isPlatform={p.isPlatform}
        isLoading={p.isLoading}
        pageRows={p.pageRows}
        page={p.page}
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
      />
    </PageLayout>
  );
}
