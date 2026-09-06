import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PageSearchField } from '../../../components/ui';
import BusinessTypeFilterChips from '../components/BusinessTypeFilterChips';
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
        <div className="space-y-3">
          <PageSearchField
            value={p.search}
            onChange={p.handleSearchChange}
            placeholder={p.t('platform.companySearch')}
          />
          <BusinessTypeFilterChips
            types={p.businessTypes}
            value={p.businessType}
            onChange={p.handleBusinessTypeChange}
          />
        </div>
      )}
    >
      <PlatformCompaniesTable
        t={p.t}
        isPending={p.isPending}
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
