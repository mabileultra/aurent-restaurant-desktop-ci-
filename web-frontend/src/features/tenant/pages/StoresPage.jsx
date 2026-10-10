import { Plus } from 'lucide-react';
import { BaseButton, ErrorBanner, PageLayout } from '../../../components/ui';
import StoreFormModal from '../components/stores/StoreFormModal';
import PharmacyIntegrationSettingsModal from '../components/stores/PharmacyIntegrationSettingsModal';
import StoresFiltersBar from '../components/stores/StoresFiltersBar';
import StoresTable from '../components/stores/StoresTable';
import { useStoresPage } from '../hooks/useStoresPage';

export default function StoresPage({ showCompanySelect = false, companyIdFilter, companies = [] }) {
  const p = useStoresPage({ showCompanySelect, companyIdFilter, companies });

  return (
    <PageLayout
      title={p.t('stores.title')}
      actions={(
        <BaseButton variant="secondary" onClick={p.openCreate}>
          <Plus size={16} />
          {p.t('stores.add')}
        </BaseButton>
      )}
      filters={(
        <StoresFiltersBar
          t={p.t}
          search={p.search}
          onSearchChange={p.handleSearchChange}
          showCompanySelect={showCompanySelect}
          companies={p.companies}
          companyId={p.companyId}
          onCompanyChange={p.handleCompanyChange}
          businessTypes={p.businessTypes}
          businessType={p.businessType}
          onBusinessTypeChange={p.handleBusinessTypeChange}
          regionCode={p.regionCode}
          districtCode={p.districtCode}
          onGeoChange={p.handleGeoChange}
        />
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <StoresTable
        t={p.t}
        isPending={p.isPending}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        showCompany={showCompanySelect}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onToggleActive={(id) => p.toggleMutation.mutate(id)}
        onDelete={p.tryDelete}
        onPharmacyIntegration={p.openPharmacyIntegration}
      />

      <StoreFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        onSubmit={(payload) => p.saveMutation.mutate(payload)}
        isPending={p.saveMutation.isPending}
        initial={p.editing}
        showCompanySelect={p.showCompanySelect}
        companies={p.companies}
      />

      <PharmacyIntegrationSettingsModal
        open={Boolean(p.pharmacyIntegrationStore)}
        store={p.pharmacyIntegrationStore}
        onClose={p.closePharmacyIntegration}
      />
    </PageLayout>
  );
}
