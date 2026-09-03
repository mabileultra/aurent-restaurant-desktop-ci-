import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PageSearchField } from '../../../components/ui';
import BusinessTypeFilterChips from '../../platform/components/BusinessTypeFilterChips';
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
      filters={(
        <div className="space-y-3">
          <PageSearchField
            className="max-w-md"
            value={p.search}
            onChange={p.handleSearchChange}
            placeholder={p.t('platform.userSearch')}
          />
          {p.isPlatform && (
            <BusinessTypeFilterChips
              types={p.businessTypes}
              value={p.businessType}
              onChange={p.handleBusinessTypeChange}
            />
          )}
        </div>
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
