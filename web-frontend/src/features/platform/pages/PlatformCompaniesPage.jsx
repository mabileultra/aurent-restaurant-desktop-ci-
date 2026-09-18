import { Plus } from 'lucide-react';
import { BaseButton, ErrorBanner, PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../components/PlatformCompactFilterBar';
import { buildBusinessTypeFilterOptions } from '../utils/businessTypeFilterOptions';
import PlatformCompanyFormModal from '../components/PlatformCompanyFormModal';
import PlatformCompaniesTable from '../components/PlatformCompaniesTable';
import { usePlatformCompaniesPage } from '../hooks/usePlatformCompaniesPage';

export default function PlatformCompaniesPage() {
  const p = usePlatformCompaniesPage();

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('platform.companiesTitle')}
      actions={(
        <BaseButton onClick={p.openCreate} className="admin-btn-primary">
          <Plus size={16} />
          {p.t('platform.addCompany')}
        </BaseButton>
      )}
      filters={(
        <PlatformCompactFilterBar
          search={p.search}
          onSearchChange={p.handleSearchChange}
          searchPlaceholder={p.t('platform.companySearch')}
          filterLabel={p.t('platform.filterBusinessType')}
          filterOptions={buildBusinessTypeFilterOptions(p.t, p.businessTypes)}
          filterValue={p.businessType}
          onFilterChange={p.handleBusinessTypeChange}
        />
      )}
    >
      {p.isError ? <ErrorBanner message={p.errorMessage} /> : null}
      <PlatformCompaniesTable
        t={p.t}
        isPending={p.isPending}
        isError={p.isError}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onDelete={p.tryDelete}
      />

      <PlatformCompanyFormModal
        open={p.modalOpen}
        editing={p.editing}
        form={p.form}
        isSaving={p.saveMutation.isPending}
        businessTypes={p.businessTypes}
        onClose={p.closeModal}
        onFieldChange={p.updateField}
        onToggleBusinessType={p.toggleBusinessType}
        onSetDefaultBusinessType={p.setDefaultBusinessType}
        onSave={() => p.saveMutation.mutate()}
      />
    </PageLayout>
  );
}
