import { Plus } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../../platform/components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../../platform/utils/businessTypeFilterOptions';
import GeoFilterSelects from '../../shared/geo/GeoFilterSelects';
import StoresCompanyFilter from '../components/stores/StoresCompanyFilter';
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
        <PlatformCompactFilterBar
          search={p.search}
          onSearchChange={p.handleSearchChange}
          searchPlaceholder={p.t('platform.userSearch')}
          filterLabel={p.isPlatform ? p.t('platform.filterBusinessType') : undefined}
          filterOptions={p.isPlatform ? buildBusinessTypeFilterOptions(p.t, p.businessTypes) : undefined}
          filterValue={p.businessType}
          onFilterChange={p.handleBusinessTypeChange}
          onReset={() => {
            p.handleSearchChange('');
            p.handleBusinessTypeChange('');
            p.handleCompanyChange('');
            p.handleGeoChange({ regionCode: '', districtCode: '' });
          }}
          resetLabel={p.t('common.reset', { defaultValue: 'Сбросить' })}
          extra={(
            <>
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
        businessTypeFilter={p.isPlatform ? p.businessType : ''}
      />
    </PageLayout>
  );
}
